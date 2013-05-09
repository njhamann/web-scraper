var stackedGraphData = [];
var stats = {};
var def = [];
def[0] = {};
def[1] = {};

//parsing data
notes.forEach(function(value, index){
    //adding keys
    for(var key in value.data){
        if(!stats[key]){
            stats[key] = $.extend(true, [], def);
            //add values array
            stats[key][0].values = [];
            stats[key][0].key = key;
            stats[key][1].values = [];
            stats[key][1].key = key;
        }
    };


    for(var key in value.data){
        var mill = value.time*1000;
        stats[key][0].values.unshift([mill, value.data[key].count]);
        stats[key][1].values.unshift([mill, value.data[key].sum]);
    };
    
    
});

var whiteListStats = _.pick(stats, [
    'charged_off',
    'default_l',
    'fully_paid',
    'in_funding',
    'issued_and_current',
    'late16to30',
    'late31to120'
]);

console.log(whiteListStats);
for(var key in whiteListStats){
   stackedGraphData.push(whiteListStats[key][1]); 
} 
console.log(stats);
console.log(stackedGraphData);


var colors = d3.scale.category20();
keyColor = function(d, i) {return colors(d.key)};
var chart;
nv.addGraph(function() {
  chart = nv.models.stackedAreaChart()
                .x(function(d) { return d[0] })
                .y(function(d) { return d[1] })
                .color(keyColor)
                //.clipEdge(true);

// chart.stacked.scatter.clipVoronoi(false);

  chart.xAxis
      .tickFormat(function(d) { return d3.time.format('%x')(new Date(d)) });

  chart.yAxis
      .tickFormat(d3.format(',.2f'));

  d3.select('#note_distribution_graph svg')
    .datum(stackedGraphData)
      .transition().duration(500).call(chart);

  nv.utils.windowResize(chart.update);

  chart.dispatch.on('stateChange', function(e) { nv.log('New State:', JSON.stringify(e)); });

  return chart;
});

var pieData = [];
console.log(stats);
for(var key in whiteListStats){
    var item = {};
    item.key = key;
    item.y = whiteListStats[key][1].values[whiteListStats[key][1].values.length-1][1];
    pieData.push(item);
};
console.log(pieData);
nv.addGraph(function() {

    var width = 450,
        height = 450;

    var chart = nv.models.pieChart()
        .x(function(d) { return d.key })
        //.y(function(d) { return d.value })
        .values(function(d) { return d })
        //.labelThreshold(.08)
        //.showLabels(false)
        .color(d3.scale.category10().range())
        .width(width)
        .height(height)
        .donut(true);


      //chart.pie.donutLabelsOutside(true).donut(true);

    d3.select("#note_distribution_graph2 svg")
          //.datum(historicalBarChart)
        .datum([pieData])
        .transition().duration(1200)
        .attr('width', width)
        .attr('height', height)
        .call(chart);

    return chart;
});
/*
nv.addGraph(function() {
  var chart = nv.models.stackedAreaChart()
                .x(function(d) { return d[0] })
                .y(function(d) { return d[1] })
                .color(keyColor);
                //.clipEdge(true);

  chart.xAxis
      .tickFormat(function(d) { return d3.time.format('%x')(new Date(d)) });

  chart.yAxis
      .tickFormat(d3.format(',.2f'));

  d3.select('#note_distribution_graph svg')
    .datum(stackedGraphData)
      //.transition().duration(500)
      .call(chart);

  nv.utils.windowResize(chart.update);

  return chart;
});
*/
