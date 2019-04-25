/*
    Inquisition // Celestial // Modal.js

    - JS lib for all logic related to modals used throughout Celestial
 */

'use strict';

var Modal = function (contentDataType, parentObjID, modalOpts, modalType, masterAction) {
    this.contentDataType = contentDataType || '';
    this.parentObjID = parentObjID || 0;
    this.modalOpts = modalOpts || {};
    this.modalType = modalType;
    this.masterAction = masterAction;

    // modals operate using two functions: one ran during the fade out of data, and one performed after data is loaded
    this.fadeInFunct = function () {};
    this.fadeOutFunct = function () {};
    this.setModalTransitionFunctions();

    // set modal theme (requirement of vex) and other options
    this.setVexOpts();
};

Modal.prototype.setVexOpts = function () {
    /*
        Sets various options that we'll need that are used by the Vex library

        https://github.hubspot.com/vex/docs/welcome/
     */

    vex.defaultOptions.className = 'vex-theme-default';
    vex.defaultOptions.afterClose = Modal.prototype.modalCloseHandler;
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
        modalHTML = prependedHTML;
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
Modal.prototype.updateParserTemplateMapping = function (parserID, templateID, httpMethod) {
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
        if (ptMapping.parser_id === parserID && ptMapping.template_id === templateID)
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
        values = {values: [parserID, templateID]};
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

Modal.prototype.modalCloseHandler = function () {
    /*
        Handler function used to perform post-logic for any time a modal is closed
     */

    var dataType = Global.prototype.queryGlobalAccessData('get', 'tuning', 'postActionDataType'),
        apiRequestURL = '/api/v1/tuning/?t=' + dataType;

    // check if there are any existing modals; if so, reload their data
    if(Object.keys(vex.getAll()).length >= 1)
    {
        // reload relevant content set data
        ContentSet.prototype.loadModalContentSet(dataType, '', true, true);
    }
    else
    {
        // no modals left open other than active one; close it
        // override API url when dealing with IOC field mappings since it's a "correlated" object type
        // see Issue #107 < https://github.com/magneticstain/Inquisition/issues/107 >
        if(dataType === 'ioc_field_mapping')
        {
            // use the 'all' special value here since IOC field mapping listings require field data as well
            apiRequestURL = '/api/v1/tuning/?t=all';
        }

        // query api and reload relevant config item table with returned data
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

            $('.' + dataType + 'Blob').replaceWith(ConfigTable.prototype.getConfigTableHTML(dataType, apiData,
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

Modal.prototype.postDataSaveHandler = function (apiResponse, dataType) {
    /*
        Handler function for after a config data within a modal is saved/created
     */

    // process primary post-save logic
    if(apiResponse.status === 'success')
    {
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

        // set data type for use later in api query callback funct (dataType isn't in scope for callback funct)
        Global.prototype.queryGlobalAccessData('set', 'tuning', 'postActionDataType', dataType);

        vex.closeTop();
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

    // set data type for use later in other callback funct(s)
    Global.prototype.queryGlobalAccessData('set', 'tuning', 'initialDataType', dataType);
    Global.prototype.queryGlobalAccessData('set', 'tuning', 'postActionDataType', dataType);

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
                    templateId = apiData.data[0].template_id || 0,
                    baseCSDContainerClasses = 'modalContentSetData dataBlobWrapper dataBlobContainer';

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
                        '<div class="' + baseCSDContainerClasses + ' fieldList" ' +
                        'data-datatype="field" data-field-id="' + fieldId + '" data-identifier="' + fieldId + '">'
                        + '</div>' + '<div class="' + baseCSDContainerClasses + ' regexList" ' +
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
                var useManualActionButtons = false;

                if(action != null && action.toLowerCase() === 'add')
                {
                    useManualActionButtons = true;
                }

                // gather fields and regex data
                ContentSet.prototype.loadModalContentSet('field', dataType, true, false);
                ContentSet.prototype.loadModalContentSet('regex', dataType, true, false);

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

                ContentSet.prototype.loadModalContentSet('template', 'parser', false, true);

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
                    useManualActionButtons = true;
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
                var useManualActionButtons = false;

                if(action != null && action.toLowerCase() === 'add')
                {
                    useManualActionButtons = true;
                }

                // load content set data
                ContentSet.prototype.loadModalContentSet('field', 'ioc_field_mapping', true, false);

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
                var useManualActionButtons = false;

                if(action != null && action.toLowerCase() === 'add')
                {
                    useManualActionButtons = true;
                }

                // load content set data
                ContentSet.prototype.loadModalContentSet('field_type', 'field', true, true);

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
                    useManualActionButtons = true;
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