d3.json('test.json',function (json) {
    var dataset = json;

    var n = parseInt(_.maxBy(dataset, 'id').id), // number of layers
        m = _.uniqBy(dataset, 'category').length, // number of samples per layer
        maxNum = parseInt(_.maxBy(dataset, 'num').num),
        stack = d3.layout.stack(),
        layers = stack(d3.range(n).map(function(i) { return bumpLayer(i+1); })),
        yGroupMax = d3.max(layers, function(layer) { return d3.max(layer, function(d) { return d.y; }); }),
        yStackMax = d3.max(layers, function(layer) { return d3.max(layer, function(d) { return d.y0 + d.y; }); });

    updateDropDown();

    var margin = {top: 40, right: 10, bottom: 20, left: 40},
        width = 960 - margin.left - margin.right,
        height = 500 - margin.top - margin.bottom;
    var x = d3.scale.ordinal()
        .domain([1,m])
        .rangeRoundBands([0, width], .08);

    var y = d3.scale.linear()
        .domain([0, yStackMax])
        .range([height, 0]);

    var color = d3.scale.linear()
        .domain([1, n])
        .range(["#aad", "#556"]);

    var yAxis = d3.svg.axis()
        .scale(y)
        .tickSize(0)
        .tickPadding(5)
        .orient("left");

    var xAxis = d3.svg.axis()
        .scale(x)
        .tickSize(0)
        .tickPadding(5)
        .orient("bottom");

    var svg = d3.select("body").append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom + 20)
        .append("g")
        .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

    var layer = svg.selectAll(".layer")
        .data(layers)
        .enter().append("g")
        .attr("class", "layer")
        .style("fill", function(d, i) { return color(i); });

    var rect = layer.selectAll("rect")
        .data(function(d) { return d; })
        .enter().append("rect")
        .attr("x", function(d) { return x(d.x); })
        .attr("y", height)
        .attr("width", x.rangeBand())
        .attr("height", 0);

    rect.transition()
        .delay(function(d, i) { return i * 10; })
        .attr("y", function(d) { return y(d.y0 + d.y); })
        .attr("height", function(d) { return y(d.y0) - y(d.y0 + d.y); });

    svg.append("g")
        .attr("class", "x axis")
        .attr("transform", "translate(0," + height + ")")
        .call(xAxis);

    svg.append("g")
        .attr("class", "y axis")
        .attr("transform", "translate(0,0)")
        .call(yAxis);

    svg.append("text")
        .attr("transform","rotate(-90)")
        .attr("y", 0 - margin.left)
        .attr("x", 0-(height/2))
        .attr("dy","1em")
        .text("Num");

    svg.append("text")
        .attr("class","xtext")
        .attr("x",width/2)
        .attr("y",height + margin.bottom + 10)
        .attr("text-anchor","middle")
        .text("Category");

    svg.append("text")
        .attr("class","title")
        .attr("x", (width / 2))
        .attr("y", -20)
        .attr("text-anchor", "middle")
        .style("font-size", "16px")
        .style("text-decoration", "underline")
        .text("Num per category.");

    var dataGroup;
    function bumpLayer(layer_index) {
        function autoFillData() {
            for(var i = 1; i <= m; i++){
                if(typeof _.find(dataGroup,{'category':i.toString()})  == 'undefined'){
                    dataGroup[dataGroup.length] = {
                        'category': m.toString(),
                        'id': layer_index.toString(),
                        'num': '0'
                    }
                }
            }
        }

        dataGroup = _.filter(dataset, {'id':layer_index.toString()});
        if(dataGroup.length < m) autoFillData();

        return dataGroup.map(function(d, i) {
            return {x: parseInt(d.category), y: parseInt(d.num)};
        });
    }

    function updateDropDown(){
        for(var i = 1; i <= _.uniqBy(dataset, 'category').length; i++){
            $("#category-dropdown").append( '<li><a class="m" href="#" value="'+i+'">' + i + '</a></li>' );
        }
    }
});