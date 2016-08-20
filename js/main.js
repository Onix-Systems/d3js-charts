$.ajax({
    url: '/getJson.php',
    data: {'url': config.config_json},
    type: 'GET',
    success: function (resp) {
        try {
            var configJson = JSON.parse(resp);
        } catch (e) {
            alert(resp);
        }
        $.ajax({
            url: '/getJson.php',
            data: {'url': config.json_url},
            type: 'GET',
            success: function (resp) {
                try {
                    JSON.parse(resp);
                } catch (e) {
                    alert(resp);
                }
                var dataset = [];
                configJson.runs.forEach(function (d) {
                    dataset.push(_.filter(JSON.parse(resp),{"run_name":d})[0])
                });

                if (dataset) {
                    var current_run = 0,
                        current_metric = 'speed',
                        run_config = _.find(configJson.mapping,{'run_name':dataset[current_run].run_name});
                    var formatTime = d3.timeFormat("%I:%M:%S");
                    var parseTime = d3.timeParse("%I:%M:%S");
                    $('.run-label span').html(dataset[0].run_name);

                    updateDropDown();

                    function drawLineChart(game, index) {
                        d3.select('.shoe-chart[data-index="' + index + '"]').select('.chart-container').selectAll("svg").remove();
                        $('.back-btn[data-index="' + index + '"]').removeClass('hidden');
                        var height = 500,
                            width = 960,
                            margin = 45,
                            rawData = _.find(dataset[current_run].Shoe_array[index].game_array, {'game_name': game}).metric_array,
                            data = [],
                            minTime = parseTime(rawData[0].Ts),
                            maxTime = parseTime(rawData[0].Ts);
                        rawData.forEach(function (d) {
                            if (parseTime(d.Ts) > maxTime) {
                                maxTime = parseTime(d.Ts)
                            } else if (parseTime(d.Ts) < minTime) {
                                minTime = parseTime(d.Ts)
                            }
                        });
                        var svg = d3.select('.shoe-chart[data-index="' + index + '"]').select('.chart-container').append("svg")
                            .attr("class", "axis")
                            .attr("width", width)
                            .attr("height", height);

                        var xAxisLength = width - 2 * margin;

                        var yAxisLength = height - 2 * margin;

                        var scaleX = d3.time.scale()
                            .domain([minTime, maxTime])
                            .range([0, xAxisLength]);

                        var scaleY = d3.scale.linear()
                            .domain([parseInt(_.maxBy(rawData, current_metric)[current_metric]), 0])
                            .range([0, yAxisLength]);

                        for (var i = 0; i < rawData.length; i++)
                            data.push({
                                x: scaleX(parseTime(rawData[i].Ts)) + margin,
                                y: scaleY(parseInt(rawData[i][current_metric])) + margin
                            });

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
                            .x(function (d) {
                                return d.x;
                            })
                            .y(function (d) {
                                return d.y;
                            });
                        var points = [];
                        var div = d3.select('.shoe-chart[data-index="' + index + '"]').select('.chart-container').append("div")
                            .attr("class", "tooltip")
                            .style("opacity", 0);
                        data.forEach(function (elem) {
                            points.push([elem.x, elem.y])
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
                            .attr("transform", function (d) {
                                return "translate(" + [scaleX(parseTime(d.Ts)) + margin, scaleY(d[current_metric]) + margin] + ")";
                            })
                            .on("mouseover", function (d) {
                                div.transition()
                                    .duration(200)
                                    .style("opacity", .9);
                                div.html(d[current_metric])
                                    .style("left", (d3.event.pageX) + "px")
                                    .style("top", (d3.event.pageY - 28) + "px");
                            })
                            .on("mouseout", function (d) {
                                div.transition()
                                    .duration(500)
                                    .style("opacity", 0);
                            });
                        svg.append("text")
                            .attr("transform", "rotate(-90)")
                            .attr("y", 0)
                            .attr("x", 0 - (height / 2))
                            .attr("dy", "1em")
                            .attr("style", "font-size:15px")
                            .text(current_metric);

                        svg.append("text")
                            .attr("class", "xtext")
                            .attr("x", width / 2)
                            .attr("y", height)
                            .attr("text-anchor", "middle")
                            .attr("style", "font-size:15px")
                            .text("time");
                    }

                    function drawBoxChart(shoe, index) {
                        d3.select('.shoe-chart[data-index="' + index + '"]').select('.chart-container').selectAll("svg").remove();
                        $('.back-btn[data-index="' + index + '"]').addClass('hidden');
                        var labels = true; // show the text labels beside individual boxplots?

                        var margin = {top: 30, right: 50, bottom: 70, left: 50};
                        var width = 960 - margin.left - margin.right;
                        var height = 500 - margin.top - margin.bottom;

                        var min = Infinity,
                            max = -Infinity;

                        // parse in the data
                        if (shoe) {

                            var data = [];

                            for (var i = 0; i <= shoe.game_array.length - 1; i++) {
                                data[i] = [];
                                data[i][0] = shoe.game_array[i].game_name;
                                data[i][1] = [];
                                shoe.game_array[i].metric_array.forEach(function (d) {
                                    data[i][1].push(d[current_metric])
                                });
                                var rowMax = parseInt(_.maxBy(shoe.game_array[i].metric_array, current_metric)[current_metric]);
                                var rowMin = parseInt(_.minBy(shoe.game_array[i].metric_array, current_metric)[current_metric]);

                                if (rowMax > max) max = rowMax;
                                if (rowMin < min) min = rowMin;
                            }
                            var chart = d3.box()
                                .whiskers(iqr(1.5))
                                .height(height)
                                .domain([min, max])
                                .showLabels(labels);
                            var svg = d3.select('.shoe-chart[data-index="' + index + '"]').select('.chart-container').append("svg")
                                .attr("width", width + margin.left + margin.right)
                                .attr("height", height + margin.top + margin.bottom)
                                .attr("class", "box")
                                .append("g")
                                .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

                            // the x-axis
                            var x = d3.scale.ordinal()
                                .domain(data.map(function (d) {
                                    return d[0]
                                }))
                                .rangeRoundBands([0, width], 0.7, 0.3);

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
                                    return (d[0]);
                                })
                                .attr("transform", function (d) {
                                    return "translate(" + x(d[0]) + "," + margin.top + ")";
                                })
                                .call(chart.width(x.rangeBand()));

                            // draw y axis
                            svg.append("g")
                                .attr("class", "y axis")
                                .call(yAxis)
                                .append("text") // and text1
                                .attr("transform", "rotate(-90)")
                                .attr("y", 0 - margin.left)
                                .attr("x", 0 - (height / 2) + margin.top)
                                .attr("dy", ".71em")
                                .style("text-anchor", "end")
                                .style("font-size", "16px")
                                .text(current_metric);

                            // draw x axis
                            svg.append("g")
                                .attr("class", "x axis")
                                .attr("transform", "translate(0," + (height + margin.top + 10) + ")")
                                .call(xAxis)
                                .append("text")             // text label for the x axis
                                .attr("x", (width / 2))
                                .attr("y", 15)
                                .attr("dy", ".71em")
                                .style("text-anchor", "middle")
                                .style("font-size", "16px")
                                .text("game");
                        }

                        // Returns a function to compute the interquartile range.
                        function iqr(k) {
                            return function (d, i) {
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

                        d3.select('.shoe-chart[data-index="' + index + '"]').select('.chart-container')
                            .selectAll("g").on('click', function () {
                            var game = this.getAttribute("data-id");
                            if (game) {
                                var index = $(this).closest('.shoe-chart').data('index');
                                drawLineChart(game, index);
                            }

                        });
                    }

                    function drawBarChart(shoe, index) {
                        d3.select('.shoe-chart[data-index="' + index + '"]').select('.chart-container').selectAll("svg").remove();
                        var n = 0;// number of layers
                        $('.back-btn[data-index="' + index + '"]').addClass('hidden');
                        shoe.game_array.forEach(function (d, i) {
                            if (d.metric_array.length > n) {
                                n = d.metric_array.length
                            }
                        });
                        var m = shoe.game_array.length, // number of samples per layer
                            stack = d3.layout.stack(),
                            layers = stack(d3.range(n).map(function (i) {
                                return bumpLayer(i);
                            })),
                            yGroupMax = d3.max(layers, function (layer) {
                                return d3.max(layer, function (d) {
                                    return d.y;
                                });
                            }),
                            yStackMax = d3.max(layers, function (layer) {
                                return d3.max(layer, function (d) {
                                    return d.y0 + d.y;
                                });
                            });

                        var margin = {top: 30, right: 50, bottom: 70, left: 50},
                            width = 960 - margin.left - margin.right,
                            height = 500 - margin.top - margin.bottom;

                        var x = d3.scale.ordinal()
                            .domain(shoe.game_array.map(function (d) {
                                return d.game_name
                            }))
                            .rangeRoundBands([0, width], .08);

                        var y = d3.scale.linear()
                            .domain([0, yStackMax])
                            .range([height, 0]);

                        var color = d3.scale.linear()
                            .domain([0, n - 1])
                            .range(["#aad", "#556"]);

                        var xAxis = d3.svg.axis()
                            .scale(x)
                            .tickSize(0)
                            .tickPadding(6)
                            .orient("bottom");

                        var yAxis = d3.svg.axis()
                            .scale(y)
                            .tickSize(0)
                            .tickPadding(6)
                            .orient("left");

                        var svg = d3.select('.shoe-chart[data-index="' + index + '"]').select('.chart-container').append("svg")
                            .attr("width", width + margin.left + margin.right)
                            .attr("height", height + margin.top + margin.bottom)
                            .append("g")
                            .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

                        var layer = svg.selectAll(".layer")
                            .data(layers)
                            .enter().append("g")
                            .attr("class", "layer")
                            .style("fill", function (d, i) {
                                return color(i);
                            });

                        var rect = layer.selectAll("rect")
                            .data(function (d) {
                                return d;
                            })
                            .enter().append("rect")
                            .attr("x", function (d) {
                                return x(d.x);
                            })
                            .attr("y", height)
                            .attr("width", x.rangeBand())
                            .attr("height", 0).attr('data-id', function (d, i) {
                                return (dataset[current_run].Shoe_array[index].game_array[i].game_name);
                            });

                        rect.transition()
                            .delay(function (d, i) {
                                return i * 10;
                            })
                            .attr("y", function (d) {
                                return y(d.y0 + d.y);
                            })
                            .attr("height", function (d) {
                                return y(d.y0) - y(d.y0 + d.y);
                            });

                        svg.append("g")
                            .attr("class", "x axis")
                            .attr("transform", "translate(0," + height + ")")
                            .call(xAxis)
                            .append("text")             // text label for the x axis
                            .attr("x", (width / 2))
                            .attr("y", 15)
                            .attr("dy", ".71em")
                            .style("text-anchor", "middle")
                            .style("font-size", "16px")
                            .text("game");

                        svg.append("g")
                            .attr("class", "y axis")
                            .attr("transform", "translate(0,0)")
                            .call(yAxis)
                            .append("text") // and text1
                            .attr("transform", "rotate(-90)")
                            .attr("y", 0 - margin.left)
                            .attr("x", 0 - (height / 2) + margin.top)
                            .attr("dy", ".71em")
                            .style("text-anchor", "end")
                            .style("font-size", "16px")
                            .text(current_metric);

                        function bumpLayer(i) {

                            var a = [];
                            shoe.game_array.forEach(function (d) {
                                a.push(d.metric_array[i][current_metric])
                            });
                            return a.map(function (d, i) {
                                return {x: shoe.game_array[i].game_name, y: Math.max(0, d)};
                            });
                        }

                        d3.select('.shoe-chart[data-index="' + index + '"]').select('.chart-container')
                            .selectAll("rect").on('click', function () {
                            var game = this.getAttribute("data-id");
                            if (game) {
                                var index = $(this).closest('.shoe-chart').data('index');
                                drawLineChart(game, index);
                            }

                        });
                    }

                    function updateDropDown() {
                        dataset.forEach(function (d, i) {
                            $("#category-dropdown").append('<li><a class="m" href="#" value="' + i + '">' + d.run_name + '</a></li>');
                        });
                    }

                    d3.selectAll(".m")
                        .on("click", function () {
                            var date = this.getAttribute("value");
                            current_run = date;
                            run_config = _.find(configJson.mapping,{'run_name':dataset[current_run].run_name});
                            $('.run-label span').html(dataset[date].run_name);
                            drawShoes(dataset[date], current_metric)
                        });

                    d3.select("#draw-stacked-chart")
                        .on("click", function () {
                            drawShoes(dataset[current_run], current_metric)
                        });

                    function drawShoes(run, metric) {
                        $('.main-container').empty();
                        run.Shoe_array.forEach(function (d, i) {
                            $('.main-container').append('<div class="shoe-chart" data-index="' + i + '">' +
                                '<h2>' + run.run_name + '.' + d.shoe_name + '</h2>' +
                                '<div class="chart-container">' +
                                '<div class="navbar navbar-default navbar-static-top">' +
                                '<ul class="nav navbar-nav">'+
                                '<li>'+
                                '<a href = "javascript:void(0);" class="hidden back-btn" data-index="' + i + '">Back</a>'+
                                '</li>'+
                                '</ul>' +
                                '<ul class="nav navbar-nav navbar-right">' +
                                '<li class="dropdown">' +
                                '<a class="dropdown-toggle metric-dropdown" data-toggle="dropdown" href = "javascript:void(0);">'+current_metric+' <span class="caret"></span></a>' +
                                '<ul class="dropdown-menu" id="category-dropdown">' +
                                '<li><a class="metric_select" href = "javascript:void(0);" value="speed">Speed</a></li>' +
                                '<li><a class="metric_select" href = "javascript:void(0);" value="val">Val</a></li>' +
                                '</ul>' +
                                '</li>' +
                                '</ul>' +
                                '</div>' +
                                '</div>' +
                                '</div>');

                            if (metric == 'speed') {
                                if(run_config.aggregated_metric[0].speed == "box_chart"){
                                    drawBoxChart(d, i)
                                }else{
                                    drawBarChart(d, i)
                                }
                            } else if(metric == 'val') {
                                if(run_config.aggregated_metric[0].val == "box_chart"){
                                    drawBoxChart(d, i)
                                }else{
                                    drawBarChart(d, i)
                                }
                            }
                        });
                        $(".metric_select")
                            .on("click", function () {
                                var date = this.getAttribute("value");
                                current_metric = date;
                                drawShoes(dataset[current_run], date)
                            });
                        $(".back-btn")
                            .on("click", function () {
                                var index = $(this).data('index');
                                if (current_metric == 'speed') {
                                    if(run_config.aggregated_metric[0].speed == "box_chart"){
                                        drawBoxChart(run.Shoe_array[index], index)
                                    }else{
                                        drawBarChart(run.Shoe_array[index], index)
                                    }
                                } else if(current_metric == 'val') {
                                    if(run_config.aggregated_metric[0].val == "box_chart"){
                                        drawBoxChart(run.Shoe_array[index], index)
                                    }else{
                                        drawBarChart(run.Shoe_array[index], index)
                                    }
                                }
                            });
                    }

                    drawShoes(dataset[0], current_metric);
                }
            }
        })
    }
});