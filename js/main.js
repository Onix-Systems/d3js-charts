d3.json('test.json',function (json) {
    var dataset = json;
    var position = 0,
        timeStamp = 0;
    updateDropDown();
    
    function drawStackedChart() {
        d3.select("svg").remove();
        $("#draw-stacked-chart").addClass('hidden');
        position = 0;
        var n = parseInt(_.maxBy(dataset, 'id').id), // number of layers
            m = _.uniqBy(dataset, 'category').length, // number of samples per layer
            maxNum = parseInt(_.maxBy(dataset, 'num').num),
            stack = d3.layout.stack(),
            layers = stack(d3.range(n).map(function(i) { return bumpLayer(i+1); })),
            yGroupMax = d3.max(layers, function(layer) { return d3.max(layer, function(d) { return d.y; }); }),
            yStackMax = d3.max(layers, function(layer) { return d3.max(layer, function(d) { return d.y0 + d.y; }); });

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
            .attr("height", 0)
            .attr("style", "cursor:pointer")
            .attr("data-id", function (d) {
                return d.x
            });

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

        d3.selectAll("rect").on('click',function () {
            var category_id = this.getAttribute("data-id");
            drawLineChart(category_id);
        });

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
        scrollDetect();
    }

    function drawLineChart(category_id) {
        d3.selectAll("svg").remove();
        position = category_id;
        $("#draw-stacked-chart").removeClass('hidden');
        var height = 500,
            width = 960,
            margin = 30,
            rawData = _.filter(dataset, {'category':category_id.toString()}),
            data=[];

        var svg = d3.select("body").append("svg")
            .attr("class", "axis")
            .attr("width", width)
            .attr("height", height);

        var xAxisLength = width - 2 * margin;

        var yAxisLength = height - 2 * margin;

        var scaleX = d3.scale.linear()
            .domain([0, parseInt(_.maxBy(rawData, 'id').id)])
            .range([0, xAxisLength]);

        var scaleY = d3.scale.linear()
            .domain([parseInt(_.maxBy(rawData, 'num').num), 0])
            .range([0, yAxisLength]);

        for(i=0; i<rawData.length; i++)
            data.push({x: scaleX(parseInt(rawData[i].id))+margin, y: scaleY(parseInt(rawData[i].num)) + margin});

        var xAxis = d3.svg.axis()
            .scale(scaleX)
            .orient("bottom");

        var yAxis = d3.svg.axis()
            .scale(scaleY)
            .orient("left");

        svg.append("g")
            .attr("class", "x-axis")
            .attr("transform",
                "translate(" + margin + "," + (height - margin) + ")")
            .call(xAxis);

        svg.append("g")
            .attr("class", "y-axis")
            .attr("transform",
                "translate(" + margin + "," + margin + ")")
            .call(yAxis);

        var line = d3.svg.line()
            .x(function(d){return d.x;})
            .y(function(d){return d.y;});
        var points = [];
        var div = d3.select("body").append("div")
            .attr("class", "tooltip")
            .style("opacity", 0);
        data.forEach(function (elem) {
           points.push([elem.x,elem.y])
        });

        svg.append("g").append("path")
            .data([points])
            .attr("d", line(data))
            .style("stroke", "steelblue")
            .style("stroke-width", 2);

        svg.selectAll(".point")
            .data(rawData)
            .enter().append("circle")
            .attr("r", 4)
            .attr("transform", function(d) {
                return "translate(" + [scaleX(d.id)+margin,scaleY(d.num)+margin] + ")";
            })
            .on("mouseover", function(d) {
                console.log(d);
                div.transition()
                    .duration(200)
                    .style("opacity", .9);
                div	.html(d.num)
                    .style("left", (d3.event.pageX) + "px")
                    .style("top", (d3.event.pageY - 28) + "px");
            })
            .on("mouseout", function(d) {
                div.transition()
                    .duration(500)
                    .style("opacity", 0);
            });
        scrollDetect();
    }
    
    function drawBoxChart() {
        d3.select("svg").remove();
        $("#draw-stacked-chart").addClass('hidden');
        var margin = {top: 10, right: 50, bottom: 20, left: 50},
            width = 120 - margin.left - margin.right,
            height = 500 - margin.top - margin.bottom;

        var min = Infinity,
            max = -Infinity;

        var chart = d3.box()
            .whiskers(iqr(1.5))
            .width(width)
            .height(height);

        if(dataset) {

            var data = [];
            dataset.forEach(function(x) {
                var e = Math.floor(x.category - 1),
                    r = Math.floor(x.id - 1),
                    s = Math.floor(x.num),
                    d = data[e];
                if (!d) d = data[e] = [s];
                else d.push(s);
                if (s > max) max = s;
                if (s < min) min = s;
            });

            chart.domain([min, max]);

            var svg = d3.select("body").selectAll("svg")
                .data(data)
                .enter().append("svg")
                .attr("class", "box")
                .attr("width", width + margin.left + margin.right)
                .attr("height", height + margin.bottom + margin.top)
                .attr('data-id', function (d,i) {return i+1;})
                .append("g")
                .attr("transform", "translate(" + margin.left + "," + margin.top + ")")
                .call(chart);

            d3.selectAll(".box").on('click',function () {
                var category_id = this.getAttribute("data-id");
                drawLineChart(category_id);
            });
        }
        
        function iqr(k) {
            return function(d, i) {
                var q1 = d.quartiles[0],
                    q3 = d.quartiles[2],
                    iqr = (q3 - q1) * k,
                    i = -1,
                    j = d.length;
                while (d[++i] < q1 - iqr);
                while (d[--j] > q3 + iqr);
                return [i, j];
            };
        }
        scrollDetect();
    }
    // drawStackedChart();
    drawBoxChart();
    function updateDropDown(){
        for(var i = 1; i <= _.uniqBy(dataset, 'category').length; i++){
            $("#category-dropdown").append( '<li><a class="m" href="#" value="'+i+'">' + i + '</a></li>' );
        }
    }

    d3.selectAll(".m")
        .on("click", function() {
            var date = this.getAttribute("value");
            drawLineChart(date)
        });
    d3.select("#draw-stacked-chart")
        .on("click", function() {
            drawBoxChart()
        });

    function scrollDetect() {
        $("svg").mousewheel(function(event, delta) {
            if(event.timeStamp - timeStamp > 1000 || timeStamp == 0){
                timeStamp = event.timeStamp;
                if(delta > 0 && position < _.uniqBy(dataset, 'category').length){
                    drawLineChart(position + 1);
                }else if (delta < 0){
                    if(position > 1){
                        drawLineChart(position - 1);
                    }else if(position == 1){
                        drawBoxChart();
                    }
                }
            }
            event.preventDefault();
        });
    }
});