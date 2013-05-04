var stats = {};
var def = [];
def[0] = {bar: true, key: 'Count'};
def[1] = {key: 'Total'};
//parsing data
top_stats.forEach(function(value, index){
    //adding keys
    for(var key in value.data){
        if(!stats[key]){
            stats[key] = $.extend(true, [], def);
            //add values array
            stats[key][0].values = [];
            stats[key][1].values = [];
        }
    };


    for(var key in value.data){
        var mill = value.time*1000;
        stats[key][0].values.unshift({x: mill, y: value.data[key].count});
        stats[key][1].values.unshift({x: mill, y: value.data[key].sum});
    };
    
});
console.log(stats);
//delete stats.account_total;
//delete stats.interest_received;
for(var key in stats){
    getChart(key);
}

function getChart(key){
    console.log(key);
    var currData = stats[key];
    var chart;
    nv.addGraph(function() {
        chart = nv.models.linePlusBarChart()
            .margin({top: 30, right: 70, bottom: 50, left: 70})
            .x(function(d, i) { return i })
            .color(d3.scale.category10().range());
        console.log(chart);
        chart.xAxis.tickFormat(function(d) {
            var dx = currData[0].values[d] && currData[0].values[d].x || 0;
            return dx ? d3.time.format('%x')(new Date(dx)) : '';
        });
        chart.lines.interpolate('monotone');
        chart.y1Axis.tickFormat(function(d) { 
            return '$' + d3.format(',.2f')(d) 
        });

        chart.y2Axis.tickFormat(function(d) { 
            return '$' + d3.format(',.2f')(d) 
        });

        chart.bars.forceY([0]);
        //chart.lines.forceY([0]);

        d3.select('#'+key+'_graph svg').datum(currData).transition().duration(500).call(chart);
        
        nv.utils.windowResize(chart.update);

        chart.dispatch.on('stateChange', function(e) { 
            nv.log('New State:', JSON.stringify(e)); 
        });
        return chart;
    });

}
