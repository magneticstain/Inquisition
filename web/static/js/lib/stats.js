/*
    Inquisition // Celestial // Stats.js

    - JS lib for loading and displaying inquisition stats
 */

"use strict";

var Stats = function () {
    Stats.statDataPoints = {
        parsers: [
            [ 'Total Logs Processed', 'total_logs_processed' ],
            [ 'Total Log Processing Failures', 'total_log_processing_failures' ],
            [ 'Total Matches', 'total_matches' ],
            [ 'Total Misses', 'total_misses' ],
            [ 'Average Log Size', 'average_log_size', 'bytes' ],
            [ 'Average Log Length', 'average_log_length', 'characters' ],
            [ 'Average Log Processing Time', 'average_log_processing_time', 'μs' ]
        ],
        templates: [
            [ 'Matches', 'matches' ],
            [ 'Misses', 'misses' ]
        ]
    };
    Stats.rawStatData = [];
    Stats.chartTitles = [];
    Stats.normalizedTitles = [];
    Stats.chartData = [];
};

Stats.prototype.initChart = function (elmnt, chartData, chartOpts, chartType) {
    /*
        Create chart with given data and options
     */

    if(chartType == null)
    {
        // set to default chart type - bar graph
        chartType = 'bar';
    }

    var newChart = new Chart(elmnt, {
        type: chartType,
        data: chartData,
        options: chartOpts
    });
};

Stats.prototype.prepCharts = function () {
    /*
        Run logic for after stats wrapper has been loaded
     */


    // traverse each type of stat data point and create a graph for each
    $.map(Stats.statDataPoints, function (statTypeSet, statType) {
        $.each(statTypeSet, function (idx, datapointSet) {
            var labelSet = [];
            var statDataSet = [];
            var datasetLabel = datapointSet[0];
            var dataPointKey = datapointSet[1];
            var chartOpts = {};
            var chartType = 'bar';

            // traverse each piece of stat data we have and see if our data point is present
            $.map(Stats.rawStatData, function (statData, statKey) {
                // check if current data point has a value in stat data
                if(typeof statData[dataPointKey] !== "undefined")
                {
                    // value present, let's add it
                    labelSet.push(statKey);
                    statDataSet.push(statData[dataPointKey]);
                }
            });

            if(datapointSet[2] != null)
            {
                // unit set, append it to label
                datasetLabel += ' (' + datapointSet[2] + ')';
            }

            // init chart data
            var chartData = {
                labels: labelSet,
                datasets: [{
                    label: datasetLabel,
                    data: statDataSet,
                    backgroundColor: '#A33C1D'
                }]
            };

            // use horizontal bar graph for templates due to the volume
            if(statType === 'templates')
            {
                chartType = 'horizontalBar';
            }

            Stats.prototype.initChart($('#' + dataPointKey), chartData, chartOpts, chartType);
        });
    });
};

Stats.prototype.generateStatDataPointHTML = function (dataPointSet) {
    /*
        Create concatonated html for all data points in set
     */

    var dataPointChartHTML = '';

    $.each(dataPointSet, function (idx, datapointMetadata) {
        dataPointChartHTML += '' +
            '<h3 class="title subtitle">' + datapointMetadata[0] + '</h3>' +
            '<canvas id="' + datapointMetadata[1] + '" class="chart"></canvas>';
    });

    return dataPointChartHTML;
};

Stats.prototype.loadStats = function (onlyContent, statData, contentWrapper) {
    /*
        Load and display stats to user
     */

    Stats.rawStatData = statData.data;

    // generate chart html for parsers and templates
    var contentHTML = ' ' +
        '<div id="contentTitleWrapper" class="contentModule">' +
        '   <h1 class="title">' + Global.normalizeTitle('stats') + '</h1>' +
        '</div>' +
        '<div id="primaryContentData" class="contentModule">' +
        '   <div id="chartsWrapper" class="moduleDataWrapper">' +
        '       <h2 class="title subtitle">Parsers</h2>' +
        Stats.prototype.generateStatDataPointHTML(Stats.statDataPoints.parsers) +
        '       <h2 class="title subtitle">Templates</h2>' +
        Stats.prototype.generateStatDataPointHTML(Stats.statDataPoints.templates) +
        '   </div>' +
        '</div>';

    // update content container with html data
    contentWrapper.html(contentHTML);
};