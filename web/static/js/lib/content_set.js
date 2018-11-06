/*
    Inquisition // content_set.js

    - library for creating and manipulating sets of data within the content portion of View
 */

"use strict";

var ContentSet = function () {};

ContentSet.prototype.initModalContentSetDataListeners = function (contentSetType, parentContentDataType,
                                                             selectionIsExclusive, allowFullDeselections) {
    /*
        Prepare any event listeners needed for acting on changes by the user to the content set data list(s)
     */

    if(contentSetType == null)
    {
        throw 'no content set data type provided during CSD selector initialization';
    }

    // CSD entry listeners (select and delete)
    $('.modalContentSetDataListEntry').off().click(function () {
        var parentObjId = $(this).parents('.modalContentSet').data('obj-id'),
            parentContentDataType = $(this).parents('.modalContentWrapper').data('datatype'),
            action = $(this).parents('.modalContent').data('action'),
            itemDataType = $(this).data('data-type'),
            itemKey = $(this).data('key'),
            itemRawCfgVal = $(this).data('item-id'),
            selectedClass = 'selected';

        if(action === 'edit')
        {
            if(parentContentDataType === 'parser' && itemDataType === 'template') {
                var httpMethod = 'PUT';

                if ($(this).hasClass(selectedClass)) {
                    // element has already been selected; item should be deleted instead of created
                    httpMethod = 'DELETE';
                }

                Modal.prototype.updateParserTemplateMapping(parentObjId, itemRawCfgVal, httpMethod);
            }
            else {
                if (!$(this).hasClass(selectedClass) && !allowFullDeselections) {
                    Tuning.prototype.updateConfigVal(parentContentDataType, null, parentObjId, itemKey, itemRawCfgVal);
                }
            }
        }

        // clear all other selections if exclusive flagged is marked
        if(selectionIsExclusive === true)
        {
            // DEV NOTE: we can't just use $.siblings() here because the .modalContentSetDataListEntry elmnts are
            // separated within their own wrappers
            $(this).parents('.modalContentSetDataList').find('.modalContentSetDataListEntry').not(this)
            .removeClass(selectedClass);
        }

        // remove the hover class that has been added now that we've clicked the element
        $(this).removeClass('hover');

        // allow possibility to deselect any item, or just add the ability to select an obj (by click only*)
        if(allowFullDeselections === true)
        {
            $(this).toggleClass(selectedClass);
        }
        else
        {
            $(this).addClass(selectedClass);
        }
    }).hover(function () {
        var entryContainerElmnt = $(this).parent(),
            contentSetDataItemDataType = $(this).data('data-type'),
            contentSetDataItemId = $(this).data('item-id');

        // add delete button and its event handler
        entryContainerElmnt.prepend('<span class="modalContentSetDataActionButton delete">[-] remove</span>');
        $('.modalContentSetDataActionButton.delete').click(function () {
            ConfigTable.prototype.deleteInquisitionDataObj(contentSetDataItemDataType, contentSetDataItemId);
            $(this).parent().fadeOut();
        });

        if(!$(this).hasClass('selected'))
        {
            $(this).addClass('hover');
        }
    });

    // DEV NOTE: we perform the hover leave callback separately, on the container element instead of the entry element,+Add
    //  so that we can have the action button outside of the entry itself, but the mouseleave logic won't trigger when
    //  the user hovers over the action button
    $('.modalContentSetDataListEntryContainer').hover(function () {}, function () {
        // remove delete action button when mouse leaves
        $(this).children('.modalContentSetDataActionButton').remove();

        $(this).children('.modalContentSetDataListEntry').removeClass('hover');
    });

    // add config item handlers as well (add/edit/delete logic)
    ConfigTable.prototype.initConfigItemHandlers();
};

ContentSet.prototype.generateModalContentSetDataHTML = function (dataType, dataSet) {
    /*
        Generate HTML of interactive list using given data
     */

    if(dataType == null)
    {
        throw 'empty data type not allowed when generating modal set HTML';
    }

    var html = '<div id="' + dataType + 'DataSet" class="modalContentSetDataList ' + dataType + 'DataSet">',
        contentSetDataID = $('.' + dataType + 'List').data(dataType + '-id'),
        itemDataId = 0,
        itemName = 'UNKNOWN',
        itemKeyName = '',
        idxItemKeyName = '',
        selectedItemClassName = '',
        itemNonAddableClass = '';

    // multiple content set data IDs are supported; JSON strings are how they're stored serially
    // we should see if that's the case first and deserialize it
    try
    {
        contentSetDataID = JSON.parse(contentSetDataID);
    }
    catch (e) { }

    dataSet.forEach(function (modalContentSetItem) {
        // get item metadata based on data type
        switch(dataType)
        {
            case 'field':
                itemName = modalContentSetItem.field_name;
                itemKeyName = 'field_id';

                break;
            case 'field_type':
                itemName = '[ <strong>' + modalContentSetItem.type_key.toUpperCase() + '</strong> ] '
                    + Global.normalizeTitle(modalContentSetItem.type_name);
                itemKeyName = 'field_type';
                idxItemKeyName = 'type_id';

                break;
            case 'regex':
                itemName = '[ <strong>PATTERN:</strong> <div class="rawVal">' + modalContentSetItem.regex
                    + '</div> ]<br />[ <strong>GRP:</strong> '
                    + modalContentSetItem.regex_group + ' ]<br />[ <strong>IDX:</strong> '
                    + modalContentSetItem.regex_match_index + ' ]';
                itemKeyName = 'regex_id';

                break;
            case 'template':
                itemName = modalContentSetItem.template_name;
                itemKeyName = 'template_id';
                itemNonAddableClass = 'ignoreForObjAdding';

                break;
            default:
                throw 'unknown data type provided when generating modal content set list HTML';
        }

        // get item ID
        if(idxItemKeyName === '')
        {
            // use key name as index for ID value
            itemDataId = modalContentSetItem[itemKeyName];
        }
        else
        {
            // use alt index that has been set for given use case
            itemDataId = modalContentSetItem[idxItemKeyName];
        }

        // add html, with selected class being added if id's match
        if(itemDataId === contentSetDataID || $.inArray(itemDataId, contentSetDataID) !== -1)
        {
            selectedItemClassName = 'selected';
        }
        else
        {
            // reset class to null string
            selectedItemClassName = '';
        }

        html += '<div class="modalContentSetDataListEntryContainer">' +
            '<div class="modalContentSetDataListEntry configValInputs ' + selectedItemClassName + ' '
            + itemNonAddableClass + '" ' + 'data-data-type="' + dataType + '" data-key="' + itemKeyName
            + '" data-item-id="' + itemDataId + '">' + itemName + '</div>' +
            '</div>';
    });

    html += '</div>';

    return html;
};

ContentSet.prototype.loadModalContentSet = function (contentSetType, parentContentDataType, useExclusiveSelections,
                                                allowFullDeselection) {
    /*
        Fetch data for given modal data type, format it, and update the modal content set container
     */

    if(contentSetType == null)
    {
        throw 'empty content set type not allowed when generating modal content sets';
    }
    else
    {
        var titleCaseContentSetType = Global.normalizeTitle(contentSetType),
            titleCaseParentContentDataType = Global.normalizeTitle(parentContentDataType);
    }

    Mystic.queryAPI('GET', '/api/v1/tuning/?t=' + contentSetType, 5000, null, function (apiData) {
        $('.modalContentSetData.' + contentSetType + 'List').html(
            '<p title="' + titleCaseParentContentDataType + ' ' + titleCaseContentSetType + ' Selections" ' +
            'class="modalContentSetHeader title">' +
            '   <label for="' + contentSetType + 'DataSet" class="add">' + titleCaseContentSetType + '</label>' +
            '</p>' +
            ContentSet.prototype.generateModalContentSetDataHTML(contentSetType, apiData.data)
        );

        ContentSet.prototype.initModalContentSetDataListeners(contentSetType, parentContentDataType,
            useExclusiveSelections, allowFullDeselection);
    }, function (apiResponse) {
        var apiError = '';
        if(apiResponse.error != null)
        {
            apiError = ' [ ' + apiResponse.error + ' ]';
        }

        ErrorBot.generateError(4, 'could not load ' + contentSetType + ' data from the Inquisition API' + apiError);
    });
};