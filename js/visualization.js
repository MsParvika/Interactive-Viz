var height = 600;
var width = 600;
var margin = { upper: 20, bottom: 30, left: 10, right: 10 };

var countryCodes = [];
var cont2code=[];
d3.csv('../data/countryCodes.csv', function (data) {
    countryCodes[data.Alpha3] = data.Country;
    cont2code[data.Alpha3] = data.Alpha2;	
});

var countryData = {};
var playersData = {};
d3.csv('../data/10yearAUSOpenMatches.csv', function (data) {

    if (!countryData[data.country1]) {
        countryData[data.country1] = [];
        countryData[data.country1].country = data.country1;
        countryData[data.country1].players = [];
        countryData[data.country1].wins = 1;
		countryData[data.country1].lost = 0;
    }
	else
	    countryData[data.country1].wins += 1;
    
    if (!countryData[data.country2]) {
        countryData[data.country2] = [];
        countryData[data.country2].country = data.country2;
        countryData[data.country2].players = [];
        countryData[data.country2].lost = 1;
		countryData[data.country2].wins = 0;
    }
    else 
		countryData[data.country2].lost += 1;

    if (!countryData[data.country1].players.includes(data.player1))
        countryData[data.country1].players.push(data.player1);

    if (!countryData[data.country2].players.includes(data.player2))
        countryData[data.country2].players.push(data.player2);

    if (!playersData[data.player1]) {
        playersData[data.player1] = [];
        playersData[data.player1].country = data.country1;
        playersData[data.player1].playerName = data.player1;
        playersData[data.player1].wins = 1;
		playersData[data.player1].lost = 0;
    }
    else
        playersData[data.player1].wins += 1;
	
	if (!playersData[data.player2]) {
        playersData[data.player2] = [];
        playersData[data.player2].country = data.country2;
        playersData[data.player2].playerName = data.player2;
        playersData[data.player2].lost = 1;
		playersData[data.player2].wins= 0;
    }
    else
        playersData[data.player2].lost += 1;

}).then(showChart);


function showChart() {

    countryData=  Object.keys(countryData).map(function(key) {
		return countryData[key]; 
	});
    //var color = d3.scaleDiverging(d3.interpolateSpectral);
	var color = d3.scaleLinear().domain([0, 200]).range([0, 1]);

    var svg = d3.select('#bubbleChart').append('svg')
        .attr('height', height)
        .attr('width', width)
        .attr('transform', 'translate(0,0)');

    var g = svg.selectAll('g').data(countryData).enter().append('g');
    var scaleForRadius = d3.scaleSqrt().domain([0, 150]).range([0, 50]);     


    var simulation = d3.forceSimulation()
		.force("forceX", d3.forceX().strength(.1).x(width * .5))
		.force("forceY", d3.forceY().strength(.1).y(height * .5))
		.force("center", d3.forceCenter().x(width * .5).y(height * .5))
		.force("charge", d3.forceManyBody().strength(-15))
		.force('anti_collide', d3.forceCollide(function (d) {
			return scaleForRadius(d.wins + d.lost) + 5 }));


    var countryToolTip = d3.select("body")
        .append("div")
        .style("position", "absolute")
        .style("z-index", "10")
        .style("visibility", "hidden")
        .style("color", "white")
        .style("padding", "8px")
		.style("background-color", "rgba(0, 0, 0, 0.75)")
        .style("border-radius", "6px")
        .style("font", "10px Georgia")
        .text("tooltip");

    var bubbles = g.append('circle')
        .attr('r', function (d) {return scaleForRadius(d.wins + d.lost);})
        .attr("fill", function(d, i) {return "url(#winLostGrad" + i + ")";})
		//function (d) {
          //  return d3.interpolateBuGn(color(d.count))
			// .attr("fill", 'url("#image")')
       // })
        .on('mouseover', function (d) {
			var tot = d.wins+ d.lost
            countryToolTip.text(countryCodes[d.country]+" "+tot+" Matches");
            countryToolTip.style("visibility", "visible");
        })
        .on("mousemove", function () {
            return countryToolTip.style("top", (d3.event.pageY - 10) + "px").style("left", (d3.event.pageX + 10) + "px");
        })
        .on("mouseout", function () {
            return countryToolTip.style("visibility", "hidden");
        })
        .on('click', showPlayersChart);
		//.on('dblclick', showPlayersChart);
    
	
	var winLostGrad = g.append("svg:defs")
		.append("svg:linearGradient")
		.attr("id", function(d, i) { return "winLostGrad" + i; })
		//.attr("x1", function (d) {return d.wins;})
		//.attr('x1', '0%') // bottom  //orange color
		//.attr('y1', '0%')
		.attr('x2', function (d) { return ((d.wins * 100)/(d.wins+ d.lost))+'%';}) // to top
		//.attr('y2', '0%')
		.attr("spreadMethod", "pad");
	 
	winLostGrad.append("svg:stop")
		.attr("offset", "100%")
		.attr("stop-color", function (d) { return d3.interpolateGreens(color(d.wins+d.lost))})
		.attr("stop-opacity", 1);
	 
	winLostGrad.append("svg:stop")
		.attr("offset", "100%")
		.attr("stop-color", function (d) { return d3.interpolateOranges(color(d.lost +d.wins))})
		.attr("stop-opacity", 1);
	 
	
	simulation.nodes(countryData).on('tick', function(d){
        bubbles
        .attr("cx", function(d){ return d.x; })
        .attr("cy", function(d){ return d.y; });
        text
        .attr("x", function(d){ return d.x; })
        .attr("y", function(d){ return d.y; });
	});

    var text = g.append("text")
        .attr("dy", "-1px")
        .style("text-anchor", "middle")
        .attr("font-family", "Georgia", "serif")
        .text(function (d) {
            return d.country;
        })
		.style("font-size", "8px")
        .attr("fill", "black");
    
    bubbles.exit().remove();


    function showPlayersChart(d) {
		
		var width2 = width - margin.left ;
		var height2 = height - margin.bottom - margin.upper;

        d3.select('#barChart').html('');
        var div = document.getElementById('barChart');
        var barData = [];
        d.players.forEach(function (x) {   //convert map into array
             barData.push(playersData[x]);
        });
		
		barData.sort(function(a, b) {
				return (b.wins) - (a.wins);
					});

        if (barData.length > 5)
            barData = barData.slice(0, 5);

        var xScale = d3.scaleBand().rangeRound([margin.left, width2]).padding(0.3).domain(barData.map(function (d) {return d.playerName;}));
        var yScale = d3.scaleLinear().rangeRound([height2, margin.upper]).domain([0, barData[0].wins + barData[0].lost]);

        var yAxis = d3.axisLeft().scale(yScale).ticks(10);

        var xAxis = d3.axisBottom();

        var svg = d3.select('#barChart').append('svg')
            .attr('height', height)
            .attr('width', width)
            .attr('transform', 'translate(5,5)');
			
			
		svg.append("image")  
			.attr('xlink:href',"images/"+cont2code[d.country].toLowerCase()+".png")
			.attr('transform', 'translate(5,5)')
			//.attr('transform', 'translate(' + 350 + ',' + margin.top + ')')
			.attr("width",width2) 
			.attr("height",height2)
			.attr('x', width-580)
			.attr("opacity","0.2");

        svg.append('text')
            .attr('x', width - 220)
            .attr('y', margin.upper- 5)
            .attr("text-anchor", "middle")
            .style("font-size", "20px")
			.attr("font-family", "Georgia", "serif")
            .text('Top players of ' + countryCodes[d.country]);

        svg.append("g")
            .attr("transform", "translate(0," + height2 + ")")
            .call(d3.axisBottom(xScale))
			.attr("font-family", "Georgia", "serif")
			.style("font-size", "12px");

		
		svg.append("text")
            .attr("transform","translate(" + (width2 - 20) + " ," +(height2 + margin.upper + 20) + ")")
            .style("text-anchor", "middle")
            .text("Players");
		
        svg.append("g")
            .attr("transform", 'translate(20,0)')
            .attr("class", "axis")
            .call(yAxis)
            .append("text")
            .attr("transform", "rotate(-90)")
            .attr("x", -20)
            .attr("y", 2)
            .attr("dy", "15px")
            .style("text-anchor", "end")
			.attr("font-family", "Georgia", "serif")
            .style("fill", "black")
            .text("Total Matches");
		
		var slices = [];
		for (var i = 0; i <= barData.length; i++) {
			slices.push(barData.slice(0, i+1));
			}
		slices.forEach(function(slice, index){
			setTimeout(function(){
			  draw(slice);}, index * 400);
		  });
  
		function draw(data) {
			var colors = ["236330", "#bc4714"];
		  //.style("fill", function(d, i) { return colors[i]; });
			var bars = svg.selectAll(".bar")
				.data(data, function(d) { return d.playerName; });		

			bars.exit()
				.transition()
				.duration(300)
				.attr("y", yScale(0))
				.attr("height", height - yScale(0))
				.style('fill-opacity', 1e-6)
				.remove();
				
			 bars.enter().append("rect")
				.attr("class", "bar")
				.attr("y", yScale(0))
				.style("fill", colors[1])
				.attr("height", height - yScale(0));
				
			bars.transition().duration(300)
				.attr("y", function(d) { return yScale(d.wins + d.lost); })
				.attr("height", function(d) { return height2 - yScale(d.wins+d.lost); })
				.attr("x", function (d) { return xScale(d.playerName);  })
				.attr("width", xScale.bandwidth());
				
			var bars2 = svg.selectAll(".bar2")
				.data(data, function(d) { return d.playerName; });

			bars2.exit()
				.transition()
				.duration(300)
				.attr("y", yScale(0))
				.attr("height", height - yScale(0))
				.style('fill-opacity', 1e-6)
				.remove();
				
			 bars2.enter().append("rect")
				.attr("class", "bar2")
				.attr("y", yScale(0))
				.style("fill", colors[0])
				.attr("height", height - yScale(0));
				
			bars2.transition().duration(300)
				.attr("y", function(d) { return yScale(d.wins + d.lost); })
				.attr("height", function(d) { return height2 - yScale(d.wins); })
				.attr("x", function (d) { return xScale(d.playerName);  })
				.attr("width", xScale.bandwidth());
			   
			var labelsWin = svg.selectAll('.label')
				.data(data);
				
			labelsWin.exit()
				.transition()
				.duration(300)
				.attr("y", height)
				.style('fill-opacity', 1e-6)
				.remove();
				
			labelsWin.enter().append("text")
				.attr("class", "label")
				.attr("y", 0)
				.attr('fill', 'white')
				.attr('opacity', 0)
				.attr('text-anchor', 'middle')
				.style("font-size", "10px")
				.attr("font-family", "Georgia", "serif");

			labelsWin.transition()
				.duration(300)
				.attr('opacity', 1)
				.attr('x', function (d) { return xScale(d.playerName) + xScale.bandwidth()/ 2;  })
				.attr('y', function(d) { return yScale(d.wins + d.lost)+ (d.wins+d.lost)*5; })
				.text(function(d) { if(d.wins!=0)
					return "Wins :"+d.wins;
				});
				
			var labelsLost = svg.selectAll('.label2')
				.data(data);
				
			labelsLost.exit()
				.transition()
				.duration(300)
				.attr("y", height)
				.style('fill-opacity', 1e-6)
				.remove();
				
			 labelsLost.enter().append("text")
				.attr("class", "label2")
				.attr("y", 0)
				.attr('fill', 'white')
				.attr('opacity', 0)
				.attr('text-anchor', 'middle')
				.style("font-size", "10px")
				.attr("font-family", "Georgia", "serif");

			labelsLost.transition()
				.duration(300)
				.attr('opacity', 1)
				.attr('x', function (d) { return xScale(d.playerName) + xScale.bandwidth()/ 2;  })
				.attr('y', function(d) { return yScale(d.lost)+ d.lost*5; })
				.text(function(d) { if(d.lost!=0)
					return "Lost: "+d.lost;
				});
				
			/*var legend = svg.selectAll(".legend")
				.data(colors)
				.enter().append("g")
				.attr("class", "legend")
				.attr("transform", function(d, i) { return "translate(30," + i * 19 + ")"; });
				 
			legend.append("rect")
				.attr("x", width - 18)
				.attr("width", 18)
				.attr("height", 18)
				.style("fill", function(d, i) {return colors.slice().reverse()[i];});
				 
			legend.append("text")
				.attr("x", width + 5)
				.attr("y", 9)
				.attr("dy", ".35em")
				.style("text-anchor", "start")
				.text(function(d, i) { 
					switch (i) {
						case 0: return "Wins";
						case 1: return "Loss";
						}
				}); */

		}
	}
}
