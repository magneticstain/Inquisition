/*
    Inquisition // Celestial // Modal.js

    - JS lib for all logic related to modals used throughout Celestial
 */

"use strict";

var Modal = function (contentDataType, parentObjID, modalOpts, modalType, masterAction) {
    this.contentDataType = contentDataType ? contentDataType : '';
    this.parentObjID = parentObjID ? parentObjID : 0;
    this.modalOpts = modalOpts ? modalOpts : {};
    this.modalType = modalType;
    this.masterAction = masterAction;
    this.fadeInFunct = function () {};
    this.fadeOutFunct = function () {};

    this.setTransitionFunctions();
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
                var mappingData = apiMappingData.data;

                // add mappings to global var for later use
                Global.prototype.queryGlobalAccessData('set', 'tuning', 'parser-template-mappings', mappingData);

                // traverse mappings
                // if one matches the parent parser id, add the associated template ID to our master list
                mappingData.forEach(function (parserTemplateMapping) {
                    if(parserTemplateMapping.parser_id === parentParserId)
                    {
                        mappedTemplateIds.push(parserTemplateMapping.template_id);
                    }
                });

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
            ], '<div class="modalContentSetData templateList" data-template-id="'
                + jsonEncodedMappedTemplateIds + '"></div>', parentParserId);

            mappingContainer.html(modalHTML);

            if(callback != null)
            {
                // callback function set, run it
                callback(action);
            }
        }, function () {
            ErrorBot.generateError(4, templateFetchErrorMsg);
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

Modal.prototype.initContentSetDataSelectors = function (contentSetType, parentContentDataType, selectionIsExclusive,
                                                        allowFullDeselections, sendData) {
    /*
        Prepare any event handlers needed for acting on changes by the user to the content set data list(s)
     */

    if(contentSetType == null)
    {
        throw 'no content set data type provided during CSD selector initialization';
    }

    $('.modalContentSetDataListEntry').click(function () {
        var parentObjId = $(this).parents('.modalContentSet').data('obj-id'),
            itemDataType = $(this).data('data-type'),
            itemKey = $(this).data('key'),
            itemRawCfgVal = $(this).data('item-id'),
            selectedClass = 'selected';

        if(sendData)
        {
            if (parentContentDataType === 'parser' && itemDataType === 'template') {
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
            $(this).parent().children('.modalContentSetDataListEntry').removeClass(selectedClass);
        }

        // allow possibility to deselect any item, or just add the ability to select an obj (by click only*)
        if(allowFullDeselections === true)
        {
            $(this).toggleClass(selectedClass);
        }
        else
        {
            $(this).addClass(selectedClass);
        }
    });
};

Modal.prototype.generateModalContentSetDataHTML = function (dataType, dataSet) {
    /*
        Generate HTML of interactive list using given data
     */

    if(dataType == null)
    {
        throw 'empty data type not allowed when generating modal set HTML';
    }

    var html = '' +
        '<div data-content-set-data-type="' + dataType + '" id="' + dataType + 'DataSet" ' +
        'class="modalContentSetDataList ' + dataType + 'DataSet">',
        contentSetDataID = $('.' + dataType + 'List').data(dataType + '-id'),
        itemDataId = 0,
        itemName = 'UNKNOWN',
        itemKeyName = '',
        selectedItemClassName = '',
        itemNonAddableClass = '';

    // multiple content set data IDs are supported; JSON strings are how they're stored serially
    // we should see if that's the case
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
        itemDataId = modalContentSetItem[itemKeyName];

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

        html += '<div class="modalContentSetDataListEntry configValInputs ' + selectedItemClassName + ' '
            + itemNonAddableClass + '" ' + 'data-data-type="' + dataType + '" data-key="' + itemKeyName
            + '" data-item-id="' + itemDataId + '">' + itemName + '</div>';
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
        $('.modalContentSetData.' + contentSetType + 'List').html('<p title="' + titleCaseParentContentDataType + ' '
            + titleCaseContentSetType + ' Selections // ' +
            'Tip: press and hold the control key while clicking to unselect an option or to select multiple options" ' +
            'class="modalContentSetHeader title">' +
            '   <label for="' + contentSetType + 'DataSet">' + titleCaseContentSetType + '   </label>' +
            '</p>' +
            Modal.prototype.generateModalContentSetDataHTML(contentSetType, apiData.data)
        );

        Modal.prototype.initContentSetDataSelectors(contentSetType, parentContentDataType, useExclusiveSelections,
            allowFullDeselection, sendContentSetDataToApi);
    }, function () {
        ErrorBot.generateError(4, 'could not load ' + contentSetType + ' data from the Inquisition API');
    });
};

// -> Modal Action Functs
Modal.prototype.runTransitionFunctionsOnDemand = function (dataContainer) {
    /*
        Run obj's fadeOut and fadeIn functions in realtime
     */

    this.fadeOutFunct(false, null, dataContainer, this.masterAction, this.fadeInFunct);
};

Modal.prototype.setFormActionButtonHandlers = function () {
    /*
        Set handler functions for all action buttons
     */

    $('.clear').click(function () {
        // reset toggles
        Tuning.prototype.initToggles();

        // clear input fields
        $('.modalContent .configValInputs').val('');

        // reset modal content set data entries
        $('.modalContentSetDataListEntry').removeClass('selected');
    });

    $('.save').click(function () {
        var dataType = $(this).parents('.modalContentWrapper').data('datatype'),
            inputData = {
                keyData: {
                    fields: []
                },
                valData: {
                    values: []
                }
            };

        // collect input data
        $('.modalContentWrapper .configValInputs:not(.ignoreForObjAdding)').each(function () {
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
            inputData['keyData']['fields'].push(key);
            inputData['valData']['values'].push(val);
        });

        var callbackFunct = function (apiResponse) {
            // check if extra operations are needed
            if(dataType === 'parser')
            {
                var parserID = apiResponse.data['id'];

                $('.modalContentSetDataListEntry').each(function () {
                    if($(this).hasClass('selected'))
                    {
                        var templateID = $(this).data('item-id');

                        // add mapping
                        Modal.prototype.updateParserTemplateMapping(parserID, templateID, 'PUT');
                    }
                });
            }

            // process post-add logic
            if(apiResponse.status === 'success')
            {
                vex.close(window.modal);

                // reload dataset blob
                // override API url when dealing with IOC field mappings since it's a "correlated" object type
                // see Issue #107 < https://github.com/magneticstain/Inquisition/issues/107 >
                var apiRequestURL = '/api/v1/tuning/?t=' + dataType;
                if(dataType === 'ioc_field_mapping')
                {
                    // use the 'all' special value here since IOC field mapping listings require field data as well
                    apiRequestURL = '/api/v1/tuning/?t=all';
                }

                // query api
                Mystic.queryAPI('GET', apiRequestURL, 20000, null, function (apiResponse) {
                    var apiData = apiResponse.data,
                        addlDataForCorrelation = null;

                    // ioc field mappings require special handling; see above
                    if(dataType === 'ioc_field_mapping')
                    {
                        apiData = apiResponse.data.ioc_field_mapping;
                        addlDataForCorrelation = apiResponse.data.field;
                    }

                    $('.' + dataType + 'Blob').replaceWith(Tuning.prototype.getObjDataHTML(dataType, apiData,
                        addlDataForCorrelation));

                    // add listening for config data item blobs
                    Tuning.prototype.initConfigItemHandlers();
                }, function () {
                    ErrorBot.generateError(4, dataType + ' data could not be reloaded');
                })
            }
        };

        // send add query
        Tuning.prototype.updateConfigVal(dataType, null, null, inputData['keyData'], inputData['valData'], 'PUT',
            callbackFunct);
    });
};

Modal.prototype.setTransitionFunctions = function () {
    /*
        Set the fade-in and fade-out functions based on various params
     */

    switch(this.contentDataType)
    {
        case 'template':
            this.fadeOutFunct = function (onlyContent, apiData, contentWrapper, action, callback) {
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
                        '<div class="modalContentSetData fieldList" data-field-id="' + fieldId + '">'
                            + '</div>'
                            + '<div class="modalContentSetData regexList" data-regex-id="' + regexId + '">'
                            + '</div>',
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

                Tuning.prototype.setConfigChangeTriggerEvts(useManualActionButtons);
                Modal.prototype.setFormActionButtonHandlers();

                // gather fields and regex data
                Modal.prototype.loadModalContentSet('field', 'template', true, false, sendDataToApi);
                Modal.prototype.loadModalContentSet('regex', 'template', true, false, sendDataToApi);
            };

            break;
        case 'parser':
            this.fadeOutFunct = function (onlyContent, apiData, contentWrapper, action, callback) {
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

                Tuning.prototype.setConfigChangeTriggerEvts(useManualActionButtons);
                Modal.prototype.setFormActionButtonHandlers();

                Modal.prototype.loadModalContentSet('template', 'parser', false, true);
            };

            break;
        case 'known_host':
            this.fadeOutFunct = function (onlyContent, apiData, contentWrapper, action, callback) {
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
            this.fadeOutFunct = function (onlyContent, apiData, contentWrapper, action, callback) {
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
                        '<div class="modalContentSetData fieldList" data-field-id="' + fieldId + '">' + '</div>',
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

                Tuning.prototype.setConfigChangeTriggerEvts(useManualActionButtons);
                Modal.prototype.setFormActionButtonHandlers();

                // load content set data
                Modal.prototype.loadModalContentSet('field', 'ioc_field_mapping', true, false, sendDataToApi);
            };

            break;
    }
};

Modal.prototype.initModal = function (modalAction) {
    /*
        Initialize the modal and display to the user
     */

    if(modalAction == null)
    {
        modalAction = 'edit';
    }

    if(this.modalType === 'confirmation')
    {
        vex.dialog.confirm(this.modalOpts);
    }
    else
    {
        window.modal = vex.open(this.modalOpts);
    }

    // load data
    var contentContainer = $('.modalContent');
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