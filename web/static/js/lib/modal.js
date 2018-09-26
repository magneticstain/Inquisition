/*
    Inquisition // Celestial // Modal.js

    - JS lib for all logic related to modals used throughout Celestial
 */

"use strict";

var Modal = function (contentDataType, parentObjID, modalOpts, modalType, masterAction) {
    this.contentDataType = contentDataType || '';
    this.parentObjID = parentObjID || 0;
    this.modalOpts = modalOpts || {};
    this.modalType = modalType;
    this.masterAction = masterAction;
    this.fadeInFunct = function () {};
    this.fadeOutFunct = function () {};

    this.setModalTransitionFunctions();

    // set modal theme (requirement of vex)
    vex.defaultOptions.className = 'vex-theme-default';
};

// Modal Content Functs
// Pre-Load/FadeIn
Modal.prototype.loadParserTemplateMappings = function (mappingContainer, parserData, prependedHTML, action, callback) {
    /*
        Specific function for handling updating a specific element with the data for parser-field mappings
     */

    // get any templates associated with this parser
    var parentParserId = parserData.parser_id,
        templateFetchErrorMsg = 'could not fetch parser-template mappings via Inquisition API',
        modalHTML = '';

    if(prependedHTML != null)
    {
        modalHTML = prependedHTML
    }

    // send api request via mystic lib to fetch all parser-template mappings
    Mystic.queryAPI('GET', '/api/v1/tuning/?t=parser_template_mapping', 10000, null,
        function (apiMappingData) {
            var mappedTemplateIds = [],
                jsonEncodedMappedTemplateIds = '';
            if(apiMappingData.status === 'success')
            {
                var mappingData = apiMappingData.data || [];

                // add mappings to global var for later use
                Global.prototype.queryGlobalAccessData('set', 'tuning', 'parser-template-mappings', mappingData);

                // traverse mappings
                if($.isArray(mappingData))
                {
                    // if one matches the parent parser id, add the associated template ID to our master list
                    mappingData.forEach(function (parserTemplateMapping) {
                        if(parserTemplateMapping.parser_id === parentParserId)
                        {
                            mappedTemplateIds.push(parserTemplateMapping.template_id);
                        }
                    });
                }
                else
                {
                    ErrorBot.generateError(2, 'API query was successful, but parser template mappings not found');
                }

                // jsonify template ID list so it can be used properly with .data()
                jsonEncodedMappedTemplateIds = JSON.stringify(mappedTemplateIds);
            }
            else
            {
                ErrorBot.generateError(4, templateFetchErrorMsg + ' :: [ ' + apiMappingData.error + ' ]');
            }

            modalHTML += Modal.prototype.generateModalContentHTML([
                {
                    inputType: 'toggle',
                    label: 'Status',
                    desc: 'Status of parser (enabled or disabled)',
                    dataType: 'parser',
                    section: '',
                    key: 'status',
                    rawVal: parserData.status
                },
                {
                    inputType: 'text',
                    label: 'Name',
                    desc: 'Name of parser',
                    dataType: 'parser',
                    section: '',
                    key: 'parser_name',
                    rawVal: parserData.parser_name
                },
                {
                    inputType: 'text',
                    label: 'Log File',
                    desc: 'Filename that log parser should analyze',
                    dataType: 'parser',
                    section: '',
                    key: 'parser_log',
                    rawVal: parserData.parser_log
                }
            ], '<div class="modalContentSetData dataBlobWrapper dataBlobContainer templateList" ' +
                'data-datatype="template" data-identifier="'+ jsonEncodedMappedTemplateIds + '" data-template-id="'
                + jsonEncodedMappedTemplateIds + '"></div>', parentParserId);

            mappingContainer.html(modalHTML);

            if(callback != null)
            {
                // callback function set, run it
                callback(action);
            }
        }, function (apiResponse) {
            var apiError = '';
            if(apiResponse.error != null)
            {
                apiError = ' :: [ ' + apiResponse.error + ' ]';
            }

            ErrorBot.generateError(4, templateFetchErrorMsg + apiError);
        });
};

Modal.prototype.generateModalContentHTML = function (optionData, modalContentSetHTML, objID) {
    /*
        Generates full HTML for an edit modal with given option data
     */

    if(modalContentSetHTML == null)
    {
        modalContentSetHTML = '';
    }

    return '' +
        '<div class="optWrapper configs">' +
        Tuning.prototype.generateAppCfgOptHTML(optionData) +
        '</div>' +
        '<div class="optSetBundle modalContentSet" data-obj-id="' + objID + '">' +
        modalContentSetHTML +
        '</div>';
};

// Post-Load/FadeOut
// -> Content Set Data
Modal.prototype.updateParserTemplateMapping = function (parser_id, template_id, httpMethod) {
    /*
        Update any mappings that match given info via Inquisition API query
     */

    var parserTemplateMappings = Global.prototype.queryGlobalAccessData('get', 'tuning', 'parser-template-mappings'),
        matchFound = false,
        mappingIdx = null,
        mappingID = null,
        keyData = null,
        values = null;

    // traverse mappings and try finding any that match our criteria
    $.each(parserTemplateMappings, function (ptMappingIdx, ptMapping) {
        if (ptMapping.parser_id === parser_id && ptMapping.template_id === template_id)
        {
            matchFound = true;
            mappingID = ptMapping.mapping_id;
            mappingIdx = ptMappingIdx;
        }
    });

    // if no mapping was found, we should add the mapping via the api
    if (!matchFound)
    {
        keyData = {fields: ['parser_id', 'template_id']};
        values = {values: [parser_id, template_id]};
    }
    else
    {
        // mapping will be deleted, so we should remove it from our mapping cache and resave
        parserTemplateMappings.splice(mappingIdx, 1);
        Global.prototype.queryGlobalAccessData('set', 'tuning', 'parser-template-mappings',
            parserTemplateMappings
        );
    }

    // perform update
    Tuning.prototype.updateConfigVal('parser_template_mapping', '', mappingID, keyData, values, httpMethod);

    return true;
};

Modal.prototype.initModalContentSetDataListeners = function (contentSetType, parentContentDataType,
                                                             selectionIsExclusive, allowFullDeselections, sendData) {
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
            itemDataType = $(this).data('data-type'),
            itemKey = $(this).data('key'),
            itemRawCfgVal = $(this).data('item-id'),
            selectedClass = 'selected';

        if(sendData)
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
            Tuning.prototype.deleteInquisitionDataObj(contentSetDataItemDataType, contentSetDataItemId);
            $(this).parent().fadeOut();
        });

        if(!$(this).hasClass('selected'))
        {
            $(this).addClass('hover');
        }
    });

    // DEV NOTE: we perform the hover leave callback separately, on the container element instead of the entry element,
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

Modal.prototype.generateModalContentSetDataHTML = function (dataType, dataSet) {
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

Modal.prototype.loadModalContentSet = function (contentSetType, parentContentDataType, useExclusiveSelections,
                                                allowFullDeselection, sendContentSetDataToApi) {
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
            Modal.prototype.generateModalContentSetDataHTML(contentSetType, apiData.data)
        );

        Modal.prototype.initModalContentSetDataListeners(contentSetType, parentContentDataType, useExclusiveSelections,
            allowFullDeselection, sendContentSetDataToApi);
    }, function (apiResponse) {
        var apiError = '';
        if(apiResponse.error != null)
        {
            apiError = ' [ ' + apiResponse.error + ' ]';
        }

        ErrorBot.generateError(4, 'could not load ' + contentSetType + ' data from the Inquisition API' + apiError);
    });
};

// -> Modal Action Functs
Modal.prototype.runTransitionFunctionsOnDemand = function (dataContainer, actionOverride) {
    /*
        Run obj's fadeOut and fadeIn functions in realtime
     */

    var action = this.masterAction;
    if(actionOverride != null)
    {
        action = actionOverride;
    }

    this.fadeOutFunct(null, dataContainer, action, this.fadeInFunct);
};

Modal.prototype.getConfigValData = function (dataType) {
    /*
        Gather all config data within modal as object and return it
     */

    var configData = {
        keyData: {
            fields: []
        },
        valData: {
            values: []
        }
    };

    $('.modalContent.' + dataType + 'Modal .configValInputs:not(.ignoreForObjAdding)').each(function () {
        var key = $(this).data('key'),
            val = '';

        if(typeof $(this).data('toggle-active') !== 'undefined')
        {
            // input is a toggle - convert state to bool
            val = $(this).data('toggle-active') === true ? 1 : 0;
        }
        else if($(this).hasClass('modalContentSetDataListEntry'))
        {
            // input is a CSD entry, which also requires different handling
            if(!$(this).hasClass('selected'))
            {
                // item wasn't selected so we don't care about it for this
                return;
            }

            val = $(this).data('item-id');
        }
        else
        {
            val = $(this).val();
        }

        // add data to master input data store
        configData['keyData']['fields'].push(key);
        configData['valData']['values'].push(val);
    });

    return configData;
};

Modal.prototype.postDataSaveHandler = function (apiResponse, dataType) {
    /*
        Handler function for after a config data within a modal is saved/created
     */

    // check if extra operations are needed
    if(dataType === 'parser')
    {
        var parserID = apiResponse.data['id'] || 0;

        // generate PT mapping for each selected template
        $('.modalContentSetDataListEntry').each(function () {
            if($(this).hasClass('selected'))
            {
                var templateID = $(this).data('item-id');
                Modal.prototype.updateParserTemplateMapping(parserID, templateID, 'PUT');
            }
        });
    }

    // process primary post-save logic
    if(apiResponse.status === 'success')
    {
        // reload dataset blob
        var apiRequestURL = '/api/v1/tuning/?t=' + dataType;
        // override API url when dealing with IOC field mappings since it's a "correlated" object type
        // see Issue #107 < https://github.com/magneticstain/Inquisition/issues/107 >
        if(dataType === 'ioc_field_mapping')
        {
            // use the 'all' special value here since IOC field mapping listings require field data as well
            apiRequestURL = '/api/v1/tuning/?t=all';
        }

        // DEV NOTE: due to a race condition with the fadeOut() animation used along with vex, we must get the
        //  parent data-type before manipulating any modals
        var parentDataType = $('.modalContentWrapper:nth-last-child(2)').data('datatype');

        // close top modal
        vex.closeTop();

        // check if there are any existing modals; if so, reload the data of them
        if(typeof vex.getAll()[2] !== 'undefined')
        {
            // modal is still open, reload the relevant CSD within it
            var modalContainer = $('.modalContent.' + parentDataType + 'Modal'),
                parentAction = modalContainer.data('action');
            Modal.prototype.setModalTransitionFunctions(parentDataType);
            Modal.prototype.runTransitionFunctionsOnDemand(modalContainer, parentAction);
        }

        // query api and reload relevant config item table with returned data
        // set data type for use later in api query callback funct (dataType isn't in scope for callback funct)
        Global.prototype.queryGlobalAccessData('set', 'tuning', 'postActionDataType', dataType);
        Mystic.queryAPI('GET', apiRequestURL, 20000, null, function (apiResponse) {
            var apiData = apiResponse.data,
                addlDataForCorrelation = null,
                dataType = Global.prototype.queryGlobalAccessData('get', 'tuning', 'postActionDataType');

            // ioc field mappings require special handling; see above
            if(dataType === 'ioc_field_mapping')
            {
                apiData = apiResponse.data.ioc_field_mapping;
                addlDataForCorrelation = apiResponse.data.field;
            }

            $('.' + dataType + 'Blob').replaceWith(ConfigTable.prototype.getObjDataHTML(dataType, apiData,
                addlDataForCorrelation));

            // add events and other post-generation magic now that the html is in place
            Tuning.prototype.runPostConfigLoad();
        }, function (apiResponse) {
            var apiError = '';
            if(apiResponse.error != null)
            {
                apiError = ' :: [ ' + apiResponse.error + ' ]';
            }

            ErrorBot.generateError(4, dataType + ' data could not be reloaded' + apiError);
        });
    }
};

Modal.prototype.setFormActionButtonHandlers = function () {
    /*
        Set handler functions for all action buttons
     */

    $('.clear').off().click(function () {
        // reset toggles
        Tuning.prototype.initToggles();

        // clear input fields
        $('.modalContent .configValInputs').val('');

        // reset modal content set data entries
        $('.modalContentSetDataListEntry').removeClass('selected');
    });

    $('.save').off().click(function () {
        var dataType = $(this).parents('.modalContentWrapper').data('datatype'),
            inputData = Modal.prototype.getConfigValData(dataType),
            callbackFunct = Modal.prototype.postDataSaveHandler;

        // send add query
        Tuning.prototype.updateConfigVal(dataType, null, null, inputData['keyData'], inputData['valData'], 'PUT',
            callbackFunct);
    });
};

Modal.prototype.setModalTransitionFunctions = function (dataTypeOverride) {
    /*
        Set the fade-in and fade-out functions based on various params
     */

    var dataType = this.contentDataType;
    if(dataTypeOverride != null)
    {
        dataType = dataTypeOverride;
    }

    switch(dataType)
    {
        case 'template':
            this.fadeOutFunct = function (apiData, contentWrapper, action, callback) {
                if(apiData == null || apiData.data == null || typeof apiData.data[0] === 'undefined')
                {
                    apiData = { data: [ {} ] };
                }

                var status = apiData.data[0].status || 0,
                    templateName = apiData.data[0].template_name || '',
                    fieldId = apiData.data[0].field_id || 0,
                    regexId = apiData.data[0].regex_id || 0,
                    templateId = apiData.data[0].template_id || 0;

                contentWrapper.html(
                    Modal.prototype.generateModalContentHTML(
                        [
                            {
                                inputType: 'toggle',
                                label: 'Status',
                                desc: 'Status of template (enabled or disabled)',
                                dataType: 'template',
                                section: '',
                                key: 'status',
                                rawVal: status
                            },
                            {
                                inputType: 'text',
                                label: 'Name',
                                desc: 'Name of template',
                                dataType: 'template',
                                section: '',
                                key: 'template_name',
                                rawVal: templateName
                            }
                        ],
                        '<div class="modalContentSetData dataBlobWrapper dataBlobContainer fieldList" ' +
                        'data-datatype="field" data-field-id="' + fieldId + '" data-identifier="' + fieldId + '">'
                        + '</div>' + '<div class="modalContentSetData dataBlobWrapper dataBlobContainer regexList" ' +
                        'data-datatype="regex" data-identifier="' + regexId + '" data-regex-id="' + regexId + '">' +
                        '</div>',
                        templateId
                    )
                );

                if(callback != null)
                {
                    // callback function set, run it
                    callback(action);
                }
            };

            this.fadeInFunct = function (action) {
                var useManualActionButtons = false,
                    sendDataToApi = true;

                if(action != null && action.toLowerCase() === 'add')
                {
                    useManualActionButtons = true;
                    sendDataToApi = false;
                }

                // gather fields and regex data
                Modal.prototype.loadModalContentSet('field', dataType, true, false, sendDataToApi);
                Modal.prototype.loadModalContentSet('regex', dataType, true, false, sendDataToApi);

                Tuning.prototype.setConfigChangeTriggerEvts(useManualActionButtons);
                Modal.prototype.setFormActionButtonHandlers();
            };

            break;
        case 'parser':
            this.fadeOutFunct = function (apiData, contentWrapper, action, callback) {
                // set default data
                if(apiData == null || apiData.data[0] == null || typeof apiData.data[0] === 'undefined')
                {
                    apiData = {
                        data: [ {
                            parser_id: 0,
                            status: 0,
                            parser_name: '',
                            parser_log: ''
                        } ]
                    };
                }

                Modal.prototype.loadParserTemplateMappings(contentWrapper, apiData.data[0], null, action, callback);
            };

            this.fadeInFunct = function (action) {
                var useManualActionButtons = false;
                if(action != null && action.toLowerCase() === 'add')
                {
                    useManualActionButtons = true
                }

                Modal.prototype.loadModalContentSet('template', 'parser', false, true);

                Tuning.prototype.setConfigChangeTriggerEvts(useManualActionButtons);
                Modal.prototype.setFormActionButtonHandlers();
            };

            break;
        case 'known_host':
            this.fadeOutFunct = function (apiData, contentWrapper, action, callback) {
                // set default data
                if(apiData == null || apiData.data[0] == null)
                {
                    apiData = { data: [ { host_val: '' } ] };
                }

                contentWrapper.html(
                    Modal.prototype.generateModalContentHTML([
                        {
                            inputType: 'text',
                            label: 'Host',
                            desc: 'IP or hostname of a node on your network known to be sending logs/data',
                            dataType: 'known_host',
                            section: '',
                            key: 'host_val',
                            rawVal: apiData.data[0].host_val
                        }
                    ])
                );

                if(callback != null)
                {
                    // callback function set, run it
                    callback(action);
                }
            };

            this.fadeInFunct = function (action) {
                var useManualActionButtons = false;
                if(action != null && action.toLowerCase() === 'add')
                {
                    useManualActionButtons = true
                }

                Tuning.prototype.setConfigChangeTriggerEvts(useManualActionButtons);
                Modal.prototype.setFormActionButtonHandlers();
            };

            break;
        case 'ioc_field_mapping':
            this.fadeOutFunct = function (apiData, contentWrapper, action, callback) {
                // set default data
                if(apiData == null || apiData.data[0] == null)
                {
                    apiData = { data: [ { ioc_item_name: '' } ] };
                }

                var mappingID = apiData.data[0].mapping_id || 0,
                    fieldId = apiData.data[0].field_id || 0;

                contentWrapper.html(
                    Modal.prototype.generateModalContentHTML([
                            {
                                inputType: 'text',
                                label: 'IOC Item Name',
                                desc: 'Name of IOC item being fetched',
                                dataType: 'ioc_field_mapping',
                                section: '',
                                key: 'ioc_item_name',
                                rawVal: apiData.data[0].ioc_item_name
                            }
                        ],
                        '<div class="modalContentSetData dataBlobWrapper dataBlobContainer fieldList" ' +
                        'data-datatype="field" data-identifier="' + fieldId + '" data-field-id="' + fieldId + '">' +
                        '</div>',
                        mappingID
                    )
                );

                if(callback != null)
                {
                    // callback function set, run it
                    callback(action);
                }
            };

            this.fadeInFunct = function (action) {
                var useManualActionButtons = false,
                    sendDataToApi = true;

                if(action != null && action.toLowerCase() === 'add')
                {
                    useManualActionButtons = true;
                    sendDataToApi = false;
                }

                // load content set data
                Modal.prototype.loadModalContentSet('field', 'ioc_field_mapping', true, false, sendDataToApi);

                Tuning.prototype.setConfigChangeTriggerEvts(useManualActionButtons);
                Modal.prototype.setFormActionButtonHandlers();
            };

            break;
        case 'field':
            this.fadeOutFunct = function (apiData, contentWrapper, action, callback) {
                // set default data
                if(apiData == null || apiData.data[0] == null)
                {
                    apiData = { data: [{ field_name: '' }] };
                }

                var fieldId = apiData.data[0].field_id || 0,
                    typeId = apiData.data[0].field_type || 0;

                contentWrapper.html(
                    Modal.prototype.generateModalContentHTML([
                            {
                                inputType: 'text',
                                label: 'Field Name',
                                desc: 'Canonical name of field that is being parsed (e.g. source_port)',
                                dataType: 'field',
                                section: '',
                                key: 'field_name',
                                rawVal: apiData.data[0].field_name
                            }
                        ],
                        '<div class="modalContentSetData dataBlobWrapper dataBlobContainer field_typeList" ' +
                        'data-datatype="field_type" data-identifier="' + typeId + '" data-type-id="' + typeId + '">' +
                        '</div>',
                        fieldId
                    )
                );

                if(callback != null)
                {
                    // callback function set, run it
                    callback(action);
                }
            };

            this.fadeInFunct = function (action) {
                var useManualActionButtons = false,
                    sendDataToApi = true;

                if(action != null && action.toLowerCase() === 'add')
                {
                    useManualActionButtons = true;
                    sendDataToApi = false;
                }

                // load content set data
                Modal.prototype.loadModalContentSet('field_type', 'field', true, true, sendDataToApi);

                Tuning.prototype.setConfigChangeTriggerEvts(useManualActionButtons);
                Modal.prototype.setFormActionButtonHandlers();
            };

            break;
        case 'field_type':
            this.fadeOutFunct = function (apiData, contentWrapper, action, callback) {
                // set default data
                if(apiData == null || apiData.data[0] == null)
                {
                    apiData = { data: [{ type_id:0, type_name: '', type_key: '' }] };
                }

                var fieldTypeID = apiData.data[0].type_id || 0,
                    fieldTypeName = apiData.data[0].type_name || '',
                    fieldTypeKey = apiData.data[0].type_key || '';

                contentWrapper.html(
                    Modal.prototype.generateModalContentHTML([
                            {
                                inputType: 'text',
                                label: 'Field Type Key',
                                desc: 'Key to be used to quickly identify field type and use for in-app correlation',
                                dataType: 'field_type',
                                section: '',
                                key: 'type_key',
                                rawVal: fieldTypeKey
                            },
                            {
                                inputType: 'text',
                                label: 'Field Type Name',
                                desc: 'Canonical name to describe the type of field that is being parsed ' +
                                    '(e.g. Traffic Source)',
                                dataType: 'field_type',
                                section: '',
                                key: 'type_name',
                                rawVal: fieldTypeName
                            }
                        ],
                        '',
                        fieldTypeID
                    )
                );

                if(callback != null)
                {
                    // callback function set, run it
                    callback(action);
                }
            };

            this.fadeInFunct = function (action) {
                var useManualActionButtons = false;

                if(action != null && action.toLowerCase() === 'add')
                {
                    useManualActionButtons = true;
                }

                Tuning.prototype.setConfigChangeTriggerEvts(useManualActionButtons);
                Modal.prototype.setFormActionButtonHandlers();
            };

            break;
        case 'regex':
            this.fadeOutFunct = function (apiData, contentWrapper, action, callback) {
                // set default data
                if(apiData == null || apiData.data[0] == null)
                {
                    apiData = { data: [{
                        regex: '',
                        regex_group: 0,
                        regex_match_index: 0
                    }] };
                }

                contentWrapper.html(
                    Modal.prototype.generateModalContentHTML([
                        {
                            inputType: 'text',
                            label: 'Regex Pattern',
                            desc: 'Regex pattern to use for matching data against',
                            dataType: 'regex',
                            section: '',
                            key: 'regex',
                            rawVal: apiData.data[0].regex
                        },
                        {
                            inputType: 'number',
                            label: 'Regex Group Index',
                            desc: 'Specifies which regex group to use (by index) that has been parsed from the data',
                            dataType: 'regex',
                            section: '',
                            key: 'regex_group',
                            rawVal: apiData.data[0].regex_group
                        },
                        {
                            inputType: 'number',
                            label: 'Regex Match Index',
                            desc: 'Specified which match to use as the parsed value when there are multiple matches ' +
                                'for each data artifact',
                            dataType: 'regex',
                            section: '',
                            key: 'regex_match_index',
                            rawVal: apiData.data[0].regex_match_index
                        }
                    ])
                );

                if(callback != null)
                {
                    // callback function set, run it
                    callback(action);
                }
            };

            this.fadeInFunct = function (action) {
                var useManualActionButtons = false;
                if(action != null && action.toLowerCase() === 'add')
                {
                    useManualActionButtons = true
                }

                Tuning.prototype.setConfigChangeTriggerEvts(useManualActionButtons);
                Modal.prototype.setFormActionButtonHandlers();
            };

            break;
        default:
            ErrorBot.generateError(4, 'unknown data type provided for item manipulation');
    }
};

Modal.prototype.initModal = function (modalAction) {
    /*
        Initialize the modal and display to the user
     */

    modalAction = modalAction || 'add';

    if(this.modalType === 'confirmation')
    {
        vex.dialog.confirm(this.modalOpts);
    }
    else
    {
        if(window.modalSet == null)
        {
            window.modalSet = [];
        }

        window.modalSet.push(vex.open(this.modalOpts));
    }

    // load data
    // DEV NOTE: the addition of the second class here is so that multiple modals can be opened and loaded independently
    var contentContainer = $('.modalContent.' + this.contentDataType + 'Modal');
    if(modalAction === 'add')
    {
        // load blank form instead of fetching data
        // we can do that by running the transition functs directly
        this.runTransitionFunctionsOnDemand(contentContainer);
    }
    else
    {
        Mystic.initAPILoad(contentContainer, 'GET', '/api/v1/tuning/?t=' + this.contentDataType
            + '&i=' + this.parentObjID, this.fadeOutFunct, this.fadeInFunct, 10000);
    }
};