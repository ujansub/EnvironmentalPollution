

var width = 900,
    height = 600;
var height = ($("#map").width()*0.6);
var projection = d3.geo.albersUsa();

var path = d3.geo.path().projection(projection);
	
var svg = d3.select("#map").append("svg")
	.attr("id","svgMAP")
    .attr("width", "100%")
    .attr("height",height);

var counties, states;

var countyData = {};
var longevityDic = {};
var qualityOfLife = {};

var digitScale = d3.scale.category10();
// console.log(digitScale);


// scatterPlot setting
var sHeight = 500;
var sWidth = 500;

var scatterSvg = d3.select("#scatterPlot").append("svg")
	.attr("width", sWidth)
	.attr("height", sHeight);

d3.json("data/us.json", function(error, shapes) {
	if (error) {console.log(error);}
	counties = topojson.feature(shapes, shapes.objects.counties).features;
	states = topojson.feature(shapes, shapes.objects.states).features;

	/****************Longevity Data*****************/
	le_male["chart"]["countries"].countryitem.forEach(function (d) {
		if (!longevityDic[Number(d.id)]) {
			longevityDic[Number(d.id)] = { male: d.v };
		}
	});
	// console.log(longevityDic);
	le_female["chart"]["countries"].countryitem.forEach(function (d) {
		var item = longevityDic[Number(d.id)];
		item = { male: Number(item.male), female: Number(d.v) }
		longevityDic[Number(d.id)] = item;
	});

	/****************Quality of life Data*****************/
	d3.csv("data/qualityoflife.csv", function (error, rows) {
		if (error) { console.log(error); }
		rows.forEach(function (d) {
			if (!qualityOfLife[Number(d.County_fips)]) {
				qualityOfLife[Number(d.County_fips)] = d;
			}
		})
		// console.log(qualityOfLife);
	});

	/****************EQIDATA_ALL_DOMAINS_2014MARCH11 Data*****************/
	d3.csv("data/EQIDATA_ALL_DOMAINS_2014MARCH11.CSV", function (error, rows) {
		if (error) {console.log(error);}
		// console.log(rows);
		rows.forEach(function (county) { 
			var cid = "" + county.fips;
			var d = {};
			if (longevityDic[Number(cid)]) {
				// pm25 no log transformed, indnpdesperkm: per 1000km of stream
				d = { state: county.state, countyName: county.county_name, id: Number(county.fips),
						  pm25: Number(county.a_pm25_mean), pm10: Number(county.a_pm10_mean_ln), so2: Number(county.a_so2_mean_ln), 
						  diesel: Number(county.a_diesel_ln), no2: Number(county.a_no2_mean_ln), co: Number(county.a_co_mean_ln),
						  lindane: Number(county.w_lindane_ln), no3: Number(county.w_no3_ln), hg: Number(county.mean_hg_ln),
						  pb: Number(county.mean_pb_ln), cu: Number(county.mean_cu_ln), al: Number(county.mean_al_pct),
						  se: Number(county.mean_se_ln), so4: Number(county.so4_mean_ave), no2_water: Number(county.w_no2_ln),
						  diseaseiInLand: Number(county.pct_disease_acres_ln), healthBusiness: Number(county.rate_hc_env_log), income: Number(county.med_hh_inc), maleLongevity: longevityDic[Number(cid)].male, femaleLongevity: longevityDic[Number(cid)].female
						};
				
			}
			else {
				d = { state: county.state, countyName: county.county_name, id: Number(county.fips),
						  pm25: Number(county.a_pm25_mean), pm10: Number(county.a_pm10_mean_ln), so2: Number(county.a_so2_mean_ln), 
						  diesel: Number(county.a_diesel_ln), no2: Number(county.a_no2_mean_ln), co: Number(county.a_co_mean_ln),
						  lindane: Number(county.w_lindane_ln), no3: Number(county.w_no3_ln), hg: Number(county.mean_hg_ln),
						  pb: Number(county.mean_pb_ln), cu: Number(county.mean_cu_ln), al: Number(county.mean_al_pct),
						  se: Number(county.mean_se_ln), so4: Number(county.so4_mean_ave), no2_water: Number(county.w_no2_ln),
						  diseaseiInLand: Number(county.pct_disease_acres_ln), healthBusiness: Number(county.rate_hc_env_log), income: Number(county.med_hh_inc), maleLongevity: 72, femaleLongevity: 76
						};
			}
			countyData[cid] = d;
		});
		drawSelectedOption("pm25");
		drawRelation(null, null, null, null);

	});
});

//my tooltip
var tooltip = d3.select("body")
		      .append("div")
		      .attr("class", "toolTip");
var tooltipTimeout;


var drawSelectedOption = function(value) {
	var range = d3.extent(Object.keys(countyData).map(function(k) { return countyData[k]; }), function (d) { return d[value]; });
	var mean = d3.mean(Object.keys(countyData).map(function(k) { return countyData[k]; }), function (d) { return d[value]; });
	var max = range[1], min = range[0];

	var colorScale = d3.scale.linear().domain(range).range(["#fefedd","#FF6F00"]);

	var quantize = d3.scale.quantize()
    .domain(range)
    .range(d3.range(9).map(function(i) { return "q" + i + "-9"; }));

    var countyPaths = svg.append("g");
	countyPaths.selectAll("path").data(counties).enter()
	.append("path")
	.attr("d", path)
	.attr("class","countyPath")
	.style("stroke", "none")
	.attr("fill", function(county){
		var eachCounty = countyData[county.id];
		if(!eachCounty){
			return "#deebf7";	
		} 
		return colorScale(eachCounty[value]);
	})
	.on("click", function(d) {
		d3.selectAll('.countyPath').style("stroke","none");
		// console.log(d);
		// console.log(this);

		if (tooltipTimeout) clearTimeout(tooltipTimeout);
		var selectedCounty = findDataOfCounty(d.id);

		var county = this;
		
		d3.select(this).style("stroke", "red")
		.style("stroke-width", "3");

		d3.select(".toolTip").transition().duration(300).style("opacity", .8);

		tooltipTimeout = setTimeout("d3.select('.tooltip').transition().duration(300).style('opacity', 0); d3.selectAll('.countypath').style('stroke', '');", 3000);

      	tooltip.html(function() {
      		var state = selectedCounty.state;
      		var countyname = selectedCounty.countyName;
      		var number = selectedCounty[value];
      		return  '<b>State: ' + state + 
      				'</b></br>County: '+ countyname + 
      				'<br>' + value + ": " + number;
      	});
      	return tooltip
      			.style("opacity","1")
      			.style("top", (d3.event.pageY + 2) + "px")
      			.style("left", (d3.event.pageX + 2) + "px");
	});

	var findDataOfCounty = function(id) {
		return countyData[id];
	}

	var statePaths = svg.append("g");
	statePaths.selectAll("path").data(states).enter()
	.append("path").attr("d", path)
	.style("fill", "none").style("stroke", "#E6E6E6")
	;

	// legend
	var unit = "";
	var format = d3.format(".2f");
	switch(value) {
		case "pm25":
		case "pm10":
			unit = "ug/m^3";
			break;
		case "diesel":
			unit = "tons/year";
			break;
		case "so2":
		case "co":
		case "no2":
			unit = "parts/billion";
			break;
		case "lindane":
		case "so4":
			unit = "mg/L";
			break;
		case "hg":
			unit = "original data unit: ng/m^2";
			break;
		case "al":
			unit = "weighted percentage";
			break;
		case "income":
			unit = "$";
			format = d3.format(".0f");
			break;
		case "maleLongevity":
		case "femaleLongevity":
			unit = "year";
			format = d3.format(".1f");
			break;
		case "healthBusiness":
			unit = "log count of businesses per person"
			break;
	}
	
    var color_domain = [format(min), format(min + (max - min) / 8), format(min + (max - min) * 2 / 8), format(min + (max - min) * 3 / 8), 
    					format(min + (max - min) * 4 / 8), format(min + (max - min) * 5 / 8), format(min + (max - min) * 6 / 8), 
    					format(min + (max - min) * 7 / 8), format(max)];

    // var colorScale = d3.scale.linear().domain(range).range(["#fff","#08306b"]);

    var legend = svg.selectAll("g.legend")
        .data(color_domain)
        .enter().append("g")
        .attr("class", "legend");

    var ls_w = 20, ls_h = 20;

    legend.append("rect")
    .attr("x", width * 0.95)
    .attr("y", function(d, i){ return height - (i*ls_h) - 2*ls_h;})
    .attr("width", ls_w)
    .attr("height", ls_h)
    .style("fill", function(d, i) { return colorScale(d); })
    .style("opacity", 0.8);

    legend.append("text")
    .attr("x", width*0.98)
    .attr("y", function(d, i){ return height -(i*ls_h) - ls_h - 4;})
    .text(function(d, i){ return color_domain[i]; });
    
    legend.append("text")
    .attr("x", width - 35)
    .attr("y", height - 210)
    .style("text-anchor", "middle")
    .text(unit);

	sizeChange();
}

/***************Scatter Chart******************/
var margin = {top: 50, right: 45, bottom: 50, left: 45}

var scatter_width = parseInt(d3.select("#scatter").style("width"), 10);
scatter_width = scatter_width - margin.left - margin.right;
var scatter_height = 700 - margin.top - margin.bottom;
var scatter_svg = d3.select('#scatter').append('svg')
.attr('width', scatter_width + margin.left + margin.right)
.attr('height', scatter_height + margin.top + margin.bottom)
.attr('transform', 'translate(' + margin.left + ', '+ margin.top +')');

var p1Scale = d3.scale.linear();
var p2Scale = d3.scale.linear();
var p1Axis = d3.svg.axis();
var p2Axis = d3.svg.axis();
var rangeP1 = [];
var rangeP2 = [];
var regressionModel = {};
var circles = scatter_svg.append("g");
var cor = 0;
var selectedParam1 = "pm25", selectedParam2 = "pm10";
var selectedParam3 = "AL";

function drawRelation (p1, p2, state1) {
	scatter_svg.selectAll("*").remove();
	if (p1 === null) p1 = selectedParam1;
	else selectedParam1 = p1;
	if (p2 === null) p2 = selectedParam2;
	else selectedParam2 = p2;
	if (state1 === null) state1 = selectedParam3;
	else selectedParam3 = state1;
	if (p1 === p2) {
		alert("Two options can't be the same. Please select a different combination.");
		return;
	}

	var p1Array = [];
	var p2Array = [];
	var circleData = [];

	if (p1 === "qualityoflife" || p2 === "qualityoflife") {
		if (p1 === "qualityoflife") {
			p1Array = Object.keys(qualityOfLife).map(function(k) { return qualityOfLife[k][p1]; });
		}
		else {
			Object.keys(countyData).map(function(k) { return countyData[k]; }).forEach(function(d) {
				if (qualityOfLife[Number(d.id)]) {
					p2Array.push(d[p1]);
				}
			});
		}
		if (p2 === "qualityoflife") {
			p2Array = Object.keys(qualityOfLife).map(function(k) { return qualityOfLife[k][p2]; });
		}
		else {
			Object.keys(countyData).map(function(k) { return countyData[k]; }).forEach(function(d) {
				if (qualityOfLife[Number(d.id)]) {
					p2Array.push(d[p2]);
				}
			});
		}
		Object.keys(countyData).map(function(k) { return countyData[k]; }).forEach(function(d) { 
			if (qualityOfLife[Number(d.id)]) {
				d["qualityoflife"] = qualityOfLife[d.id]["qualityoflife"];
				circleData.push(d);
			}
		});
		console.log(circleData);
	}
	else {
		p1Array = Object.keys(countyData).map(function(k) { return countyData[k][p1]; });
		p2Array = Object.keys(countyData).map(function(k) { return countyData[k][p2]; });
		circleData = Object.keys(countyData).map(function(k) { return countyData[k]; });
	}

	rangeP1 = d3.extent(p1Array, function (d) { return d; });
	rangeP2 = d3.extent(p2Array, function (d) { return d; });

	p1Scale.domain(rangeP1).range([0, scatter_width]);
	p2Scale.domain(rangeP2).range([scatter_height, 0]);
	// var colorScale = d3.scale.quantize().domain(states).range()

	p1Axis.scale(p1Scale).orient("bottom");
	p2Axis.scale(p2Scale).orient("left");

	d3.selection.prototype.moveToFront = function() {
	  return this.each(function(){
	    this.parentNode.appendChild(this);
	  });
	};

	scatter_svg.append("g")
	.attr("transform", "translate("+ margin.left +", "+ (scatter_height + margin.top) +")")
	.attr("class", "x axis")
	.call(p1Axis)
	.append("text")
	.attr("class", "label")
	.attr("x", scatter_width)
	.attr("y", -6)
	.style("text-anchor", "end")
	.text(p1);

	scatter_svg.append("g")
	.attr("transform", "translate("+ margin.left +", "+ margin.top +")")
	.attr("class", "y axis")
	.call(p2Axis)
	.append("text")
	.attr("class", "label")
	.attr("transform", "rotate(-90)")
	.attr("y", 6)
	.attr("dy", ".71em")
	.style("text-anchor", "end")
	.text(p2);

	var selectedCircles = [];
	var otherCircles = [];
	circleData.forEach(function(d) {
		if (d.state === state1) {
			selectedCircles.push(d);
		}
		else {
			otherCircles.push(d);
		}
	});
	
	var colors = ["#0CA9F4", "#F76661"];

	circles = scatter_svg.append("g");

	circles.selectAll(".otherCircles")
	.data(otherCircles).enter()
	.append("circle")
	.attr("class", "otherCircles")
	.attr("cx", function(d) { return p1Scale(d[p1]) + margin.left; })
	.attr("cy", function(d) { return p2Scale(d[p2]) + margin.top; })
	.attr("r", "3")
	.style("fill", colors[0])
	.attr("fill-opacity", 0.5);

	circles.selectAll(".selectedCircles")
	.data(selectedCircles).enter()
	.append("circle")
	.attr("class", "selectedCircles")
	.attr("cx", function(d) { return p1Scale(d[p1]) + margin.left; })
	.attr("cy", function(d) { return p2Scale(d[p2]) + margin.top; })
	.attr("r", "4")
	.style("fill", colors[1])
	.attr("fill-opacity", 1)
	.style("stroke-width", "1px")
	.on("click", function(d) {
		if (tooltipTimeout) clearTimeout(tooltipTimeout);
		d3.select(".toolTip").transition().duration(300).style("opacity", .8);
		tooltipTimeout = setTimeout("d3.select('.toolTip').transition().duration(300).style('opacity', 0);", 3000);
		tooltip.html(function() {
      		var state = d.state;
      		var countyname = d.countyName;
      		var number1 = d[p1];
      		var number2 = d[p2];
      		return  '<b>State: ' + state + 
      				'</b></br>County: '+ countyname + 
      				'<br>' + p1 + ": " + number1 +
      				'<br>' + p2 + ": " + number2;
      	});
      	return tooltip
      			.style("top", (d3.event.pageY + 2) + "px")
      			.style("left", (d3.event.pageX + 2) + "px");
	});

	// regression model
	function leastSquares(points) {
		var model = { intercept: 0, slope: 0 };
		
		if (points.length == 0) { return model; }
		if (points.length == 1) {
			model.slope = points[0][p2] / points[0][p1];
			return model;
		}

		var meanP1 = d3.mean(points, function (d) { 
			return d[p1];
		});
		// console.log("meanDensity:" + meanDensity);

		var meanP2 = d3.mean(points, function (d) { 
			return d[p2];
		});
		// console.log("meanOwnership:" + meanOwnership);

		model.slope = d3.sum(points, function (d) {
			return (d[p1] - meanP1) * (d[p2] - meanP2);
		});

		model.slope /= d3.sum(points, function (d) {
			return (d[p1] - meanP1) * (d[p1] - meanP1);
		});
		// console.log("model.slope:" + model.slope);

		model.intercept = meanP2 - model.slope * meanP1;
		return model;
	}

	var pearSonCor  = function(points) {
		var meanX = d3.mean(points, function (d) { 
			return d[p1];
		});
		// console.log("meanX:" + meanX);

		var meanY = d3.mean(points, function (d) { 
			return d[p2];
		});
		// console.log("meanY:" + meanY);

		var sumXY = d3.sum(points, function (d) {
			return d[p1] * d[p2];
		});
		// console.log("sumXY:" + sumXY);

		var sumXSq = d3.sum(points, function (d) {
			return d[p1] * d[p1];
		});
		// console.log("sumXSq:" + sumXSq);

		var sumYSq = d3.sum(points, function (d) {
			return d[p2] * d[p2];
		});
		// console.log("sumYSq:" + sumYSq);

		var n = points.length;
		// console.log("n:" + n);

		var res = sumXY - n * meanX * meanY;
		res /= Math.sqrt(sumXSq - n * meanX * meanX) * 
			   Math.sqrt(sumYSq - n * meanY * meanY);
		return res;
	}

	regressionModel = leastSquares(circleData);
	// console.log(regressionModel);
	cor = pearSonCor(circleData);

	var regressionLine = scatter_svg.append("line")
	.attr("class", "regression")
	.attr("x1", p1Scale(rangeP1[0]) + margin.left)
	.attr("y1", p2Scale(rangeP1[0] * regressionModel.slope + regressionModel.intercept) + margin.top)
	.attr("x2", p1Scale(rangeP1[1]) + margin.left)
	.attr("y2", p2Scale(rangeP1[1] * regressionModel.slope + regressionModel.intercept) + margin.top)
	.style("stroke", "#F76661")
	.style("stroke-width", "3");
	// console.log(regressionLine);

	var corText = scatter_svg.append("text")
	.attr("class", "cortext")
	.attr("x", scatter_width * 0.94)
	.attr("y", scatter_height)
	.text("Coorelation: " + d3.format(".2f")(cor));
	scatterResize();
}

// Make map responsive
d3.select(window).on("resize", sizeChange);

function sizeChange() {
  svg.selectAll("g").attr("transform", "scale(" + $("#map").width()/1000 + ")");
  $("#svgMAP").height($("#map").width()*0.6);
  scatterResize();
}

function scatterResize() {
	// update width
	scatter_width = parseInt(d3.select('#scatter').style('width'), 10);
	scatter_width = scatter_width - margin.left - margin.right;
	scatter_height = parseInt(d3.select('#scatter').style('height'), 10);
	scatter_height = scatter_height - margin.top - margin.bottom;

	// Update the range of the scale with new width/height
	p1Scale.range([0, scatter_width]);
	p2Scale.range([scatter_height, 0]);

	// Update the axis and text with the new scale
	scatter_svg.select('.x.axis')
	.attr("transform", "translate("+ margin.left +", "+ (scatter_height + margin.top) +")")
	.call(p1Axis);

	scatter_svg.select('.x.axis').select('.label')
	  .attr("x", scatter_width);

	scatter_svg.select('.y.axis')
		.attr("transform", "translate("+ margin.left +", "+ margin.top +")")
	.call(p2Axis);

	// Update the tick marks
	// p1Axis.ticks(scatter_width / 75);
	// p2Axis.ticks(scatter_height / 75);

	scatter_svg.select("line.regression")
	.attr("x1", p1Scale(rangeP1[0]) + margin.left)
	.attr("y1", p2Scale(rangeP1[0] * regressionModel.slope + regressionModel.intercept) + margin.top)
	.attr("x2", p1Scale(rangeP1[1]) + margin.left)
	.attr("y2", p2Scale(rangeP1[1] * regressionModel.slope + regressionModel.intercept) + margin.top);

	scatter_svg.select(".cortext")
	.attr("x", scatter_width * 0.93)
	.attr("y", scatter_height)
	.text("Coorelation: " + d3.format(".2f")(cor));

	scatter_svg.selectAll('.otherCircles')
	.attr("cx", function(d) { return p1Scale(d[selectedParam1]) + margin.left; })
	.attr("cy", function(d) { return p2Scale(d[selectedParam2]) + margin.top; });

	scatter_svg.selectAll('.selectedCircles')
	.attr("cx", function(d) { return p1Scale(d[selectedParam1]) + margin.left; })
	.attr("cy", function(d) { return p2Scale(d[selectedParam2]) + margin.top; });

}









