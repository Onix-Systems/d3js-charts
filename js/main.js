$.ajax({
    url: '/getJson.php',
    data: {'url':config.json_url},
    type: 'GET',
    success: function(resp){
        var dataset = JSON.parse(resp);
        var position = 0,
            timeStamp = 0,
            skip = 0,
            limit = 5;
        updateDropDown();

        function drawLineChart(category_id) {
            d3.select('.detail-chart').selectAll("svg").remove();
            position = parseInt(category_id);
            $("#draw-stacked-chart").removeClass('hidden');
            var height = 500,
                width = 960,
                margin = 45,
                rawData = _.filter(dataset, {'category':category_id.toString()}),
                data=[];

            var svg = d3.select("body").select(".detail-chart").append("svg")
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
            var div = d3.select("body").select(".main-container").append("div")
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
            svg.append("text")
                .attr("transform","rotate(-90)")
                .attr("y", 0)
                .attr("x", 0-(height/2))
                .attr("dy","1em")
                .attr("style","font-size:15px")
                .text("num");

            svg.append("text")
                .attr("class","xtext")
                .attr("x",width/2)
                .attr("y",height)
                .attr("text-anchor","middle")
                .attr("style","font-size:15px")
                .text("id");
        }

        function drawBoxChart(skip) {
            d3.selectAll("svg").remove();
            var showData = _.filter(dataset, function(o){ return o.category >= skip+1 && o.category <= (limit+skip) ; });
            $("#draw-stacked-chart").addClass('hidden');
            position = 0;
            var labels = true; // show the text labels beside individual boxplots?

            var margin = {top: 30, right: 50, bottom: 70, left: 50};
            var  width = 960 - margin.left - margin.right;
            var height = 500 - margin.top - margin.bottom;

            var min = Infinity,
                max = -Infinity;

            // parse in the data
            if (showData) {
                // using an array of arrays with
                // data[n][2]
                // where n = number of columns in the csv file
                // data[i][0] = name of the ith column
                // data[i][1] = array of values of ith column

                var data = [];

                // add more rows if your csv file has more columns
                for(var i = 0; i <= _.uniqBy(showData, 'category').length-1; i++){
                    data[i] = [];
                    data[i][0] = i+1+skip;
                    data[i][1] = [];
                }
                for(var i = 0; i <= _.uniqBy(showData, 'id').length-1; i++){
                    var rowData = _.filter(showData,{'id': (i+1).toString()});
                    rowData.forEach(function (d,c) {
                        data[c][1].push(Math.floor(d.num));
                    });


                    var rowMax = parseInt(_.maxBy(rowData,'num').num);
                    var rowMin = parseInt(_.minBy(rowData,'num').num);

                    if (rowMax > max) max = rowMax;
                    if (rowMin < min) min = rowMin;
                }
                var chart = d3.box()
                    .whiskers(iqr(1.5))
                    .height(height)
                    .domain([min, max])
                    .showLabels(labels);

                var svg = d3.select("body").select('.main-chart').append("svg")
                    .attr("width", width + margin.left + margin.right)
                    .attr("height", height + margin.top + margin.bottom)
                    .attr("class", "box")
                    .append("g")
                    .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

                // the x-axis
                var x = d3.scale.ordinal()
                    .domain( data.map(function(d) { return d[0] } ) )
                    .rangeRoundBands([0 , width], 0.7, 0.3);

                var xAxis = d3.svg.axis()
                    .scale(x)
                    .orient("bottom");

                // the y-axis
                var y = d3.scale.linear()
                    .domain([min, max])
                    .range([height + margin.top, 10 + margin.top]);

                var yAxis = d3.svg.axis()
                    .scale(y)
                    .orient("left");

                // draw the boxplots
                svg.selectAll(".box")
                    .data(data)
                    .enter().append("g")
                    .attr('data-id', function (d) {
                        return (d[0]+skip);
                    })
                    .attr("transform", function(d) { return "translate(" +  x(d[0])  + "," + margin.top + ")"; } )
                    .call(chart.width(x.rangeBand()));

                // draw y axis
                svg.append("g")
                    .attr("class", "y axis")
                    .call(yAxis)
                    .append("text") // and text1
                    .attr("transform", "rotate(-90)")
                    .attr("y", 0-margin.left)
                    .attr("x", 0-(height/2)+margin.top)
                    .attr("dy", ".71em")
                    .style("text-anchor", "end")
                    .style("font-size", "16px")
                    .text("num interquartile");

                // draw x axis
                svg.append("g")
                    .attr("class", "x axis")
                    .attr("transform", "translate(0," + (height  + margin.top + 10) + ")")
                    .call(xAxis)
                    .append("text")             // text label for the x axis
                    .attr("x", (width / 2) )
                    .attr("y",  15 )
                    .attr("dy", ".71em")
                    .style("text-anchor", "middle")
                    .style("font-size", "16px")
                    .text("Category");
            }

            // Returns a function to compute the interquartile range.
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
            d3.selectAll("g").on('click',function () {
                var category_id = this.getAttribute("data-id");
                if(category_id){
                    console.log(category_id);
                    drawLineChart(category_id);
                }

            });
            scrollDetect();
        }
        drawBoxChart(0);
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
            $(".main-chart svg").mousewheel(function(event, delta) {
                if(event.timeStamp - timeStamp > 800 || timeStamp == 0){
                    timeStamp = event.timeStamp;
                    if((skip+limit) != _.uniqBy(dataset,'category').length){
                        if(delta > 0){
                            skip++;
                            drawBoxChart(skip)
                        }else if(delta < 0 && skip != 0){
                            skip--;
                            drawBoxChart(skip)
                        }
                    }
                    else if(delta < 0){
                        skip--;
                        drawBoxChart(skip)
                    }
                }
                event.preventDefault();
            });
        }
    }
});