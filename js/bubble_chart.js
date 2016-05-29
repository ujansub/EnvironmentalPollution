
(function(){


/* bubbleChart creation function. 
 * Organization and style inspired by:
 * https://github.com/vlandham/bubble_cloud
 */
var WIDTH =  document.getElementById('bubbleWrapper').offsetWidth;
//console.log(WIDTH);
function bubbleChart() {
  // Constants for sizing
  var width = document.getElementById('bubbleWrapper').offsetWidth;

  var height = 600*WIDTH/840;


  // tooltip for mouseover functionality
  var tooltip = floatingTooltip('bubble_tooltip', 240);
  // Locations to move bubbles towards, depending
  // on which view mode is selected.
  var center = { x: width / 2, y: height / 2 };

  var categoryL = {
    other_pollution: { x: width / 3, y: height / 2 },
    water_pollution: { x: width / 2, y: height / 2 },
    air_pollution: { x: 2 * width / 3, y: height / 2 }
  };

  // X locations of the category.
  var categoryT = {
    other_pollution: 160*WIDTH/1140,
    water_pollution: width / 2,
    air_pollution: width - 160*WIDTH/1140
  };

/* bubble force and moving code reference to 
 Professor Mimno's demo code on 031116-index.html
*/
  // Used when setting up force and
  // moving around nodes
  var damper = 0.102;

  // These will be set in create_nodes and create_vis
  var svgB = null;
  var bubbles = null;
  var nodes = [];

/* Charge function that is called for each node. 
Charge is proportional to the diameter of the circle.
*/
  function charge(d) {
    return -Math.pow(d.radius, 2.0) / 8;
  }

  // force layout function 
  // configure it to use the charge function from above. 
  var force = d3.layout.force()
    .size([width, height])
    .charge(charge)
    .gravity(-0.01)
    .friction(0.9);


  // Color schema
  var fillColor = d3.scale.ordinal()
    .domain(['low', 'medium', 'high'])
    .range(['#F76661', '#FEF161', '#1BC1FE']);

  // turn value into radius
  var radiusScale = d3.scale.pow()
    .exponent(0.5)
    .range([2, 45*width/1140]);

  /*
   Read in data and transfer into a node object
   Each node will store data and visualization values to visualize
   */
  function createNodes(value) {
    // Use map() to convert raw data into node data.
    // Checkout http://learnjsdata.com/ for more on
    // working with data.
    var nodes = value.map(function (d) {
      return {
        id: d.id,
        radius: radiusScale(+d.amount),
        value: d.amount,
        name: d.grant_title,
        org: d.organization,
        group: d.group,
        category: d.category,
        comments: d.comments,
        x: Math.random() * 900,
        y: Math.random() * 800
      };
    });

    // sort node to prevent occlusion of smaller nodes.
    nodes.sort(function (a, b) { return b.value - a.value; });

    return nodes;
  }

  /*
   * Function prepares the rawData for visualization
   * and adds an svg element to the provided selector and starts the
   * visualization creation process.
   */
  var chart = function chart(selector, rawData) {
    var maxAmount = d3.max(rawData, function (d) { return +d.amount; });
    radiusScale.domain([0, maxAmount]);

    nodes = createNodes(rawData);
    // Set the force's nodes to our newly created nodes array.
    force.nodes(nodes);

    // Create a SVG element inside the provided selector
    // with desired size.
    svgB = d3.select(selector)
      .append('svg')
      .attr("id","bubbleSVG")
      .attr('width', width)
      .attr('height', height);

    bubbles = svgB.selectAll('.bubble')
      .data(nodes, function (d) { return d.id; });

    // Create new circle elements each with class `bubble`.
    bubbles.enter().append('circle')
      .classed('bubble', true)
      .attr('r', 0)
      .attr('fill', function (d) { return fillColor(d.group); })
//      .attr('stroke', function (d) { return d3.rgb(fillColor(d.group)).darker(); })
      .attr('stroke-width', 2)
      .on('mouseover', showDetail)
      .on('mouseout', hideDetail);

    bubbles.transition()
      .duration(2000)
      .attr('r', function (d) { return d.radius; });

    // Set initial layout to single group.
    groupBubbles();
  };

  /*
   * Sets visualization in one node group.
   */
  function groupBubbles() {
    hideCategory();

    force.on('tick', function (e) {
      bubbles.each(moveToCenter(e.alpha))
        .attr('cx', function (d) { return d.x; })
        .attr('cy', function (d) { return d.y; });
    });

    force.start();
  }

  /*
   * Helper function for displaying all node in same group.
   */
  function moveToCenter(alpha) {
    return function (d) {
      d.x = d.x + (center.x - d.x) * damper * alpha;
      d.y = d.y + (center.y - d.y) * damper * alpha;
    };
  }

  /*
   * Sets visualization in "category by pollution".
   */
  function splitBubbles() {
    showCategory();

    force.on('tick', function (e) {
      bubbles.each(moveToCategory(e.alpha))
        .attr('cx', function (d) { return d.x; })
        .attr('cy', function (d) { return d.y; });
    });

    force.start();
  }

  /*
   * Helper function for split by category.
   */
  function moveToCategory(alpha) {
    return function (d) {
      var target = categoryL[d.category];
      d.x = d.x + (target.x - d.x) * damper * alpha * 1.1;
      d.y = d.y + (target.y - d.y) * damper * alpha * 1.1;
    };
  }

  /*
   * Hides category title displays.
   */
  function hideCategory() {
    svgB.selectAll('.category').remove();
  }

  /*
   * Shows category title displays.
   */
  function showCategory() {
    var categoryData = d3.keys(categoryT);
    var category = svgB.selectAll('.category')
      .data(categoryData);

    category.enter().append('text')
      .attr('class', 'category')
      .attr('x', function (d) { return categoryT[d]; })
      .attr('y', 40)
      .attr('text-anchor', 'middle')
      .style('font-size',function(){
        return 21*WIDTH/1140+"px";
      })
      .text(function (d) {
        var temp = d ;
        var result = temp.replace(/_/g, " " );
       return result; 
      });
  }


  /*
   * moveover function
   */
  function showDetail(d) {
    // change outline to indicate hover state.
    d3.select(this).attr('stroke', 'black');

    var content = '<span class="name">Disease name: </span><span class="value">' +
                  d.name +
                  '</span><br/>' +
                  '<span class="name">Details: </span><span class="value">' +
                  helper(d.comments) +
                  '</span><br/>' +
                  '<span class="name">Category: </span><span class="value">' +
                  d.category +
                  '</span>';
    tooltip.showTooltip(content, d3.event);
  }

  /*
   * Move out function
   */
  function hideDetail(d) {
    // reset outline
    d3.select(this)
    .attr('stroke', 0)
//      .attr('stroke', d3.rgb(fillColor(d.group)).darker());

    tooltip.hideTooltip();
  }

  chart.toggleDisplay = function (displayName) {

    if (displayName === 'category') {
console.log(displayName);
      splitBubbles();
    } else {
      groupBubbles();
    }
  };
  return chart;
}

/* Bubble chart creation and data loading 
 */
var myBubbleChart = bubbleChart();

/*
 * Function called once data is loaded from CSV.
 * Calls bubble chart function to display inside #vis div.
 */
function display(error, data) {
  if (error) {
    console.log(error);
  }

  myBubbleChart('#vis', data);
}

/*
 * Sets up the layout buttons to allow for toggling between view modes.
 */
function setupButtons() {
  d3.select('#toolbar')
    .selectAll('.button')
    .on('click', function () {
      d3.selectAll('.button').classed('active', false);
      var button = d3.select(this);

      button.classed('active', true);

      var buttonId = button.attr('id');

      myBubbleChart.toggleDisplay(buttonId);
    });
}

/*convert a number into a string
 and add commas to it to improve presentation.
 */
function helper(nStr) {
  nStr += '';
  var x = nStr.split('.');
  var x1 = x[0];
  var x2 = x.length > 1 ? '.' + x[1] : '';
  var rgx = /(\d+)(\d{3})/;
  while (rgx.test(x1)) {
    x1 = x1.replace(rgx, '$1' + ',' + '$2');
  }

  return x1 + x2;
}

// Load the data.
d3.csv('data/Disease.csv', display);
sizeChange();

// setup the buttons.
setupButtons();

function sizeChange() {
  console.log("sizeChange");
  console.log($("#bubbleSVG"));
  console.log(WIDTH);
  if(WIDTH>=1140){
    $("#bubbleSVG").css({
      '-webkit-transform-origin': '0 0',
      '-webkit-transform' : 'scale(' + $("#vis").width()/WIDTH + ')',
      '-moz-transform-origin': '0 0',
      '-moz-transform'    : 'scale(' + $("#vis").width()/WIDTH + ')',
      '-ms-transform-origin': '0 0',
      '-ms-transform'     : 'scale(' + $("#vis").width()/WIDTH + ')',
      '-o-transform-origin': '0 0',
      '-o-transform'      : 'scale(' + $("#vis").width()/WIDTH + ')',
      'transform-origin': '0 0',
      'transform'         : 'scale(' + $("#vis").width()/WIDTH + ')'
    });
  }else{
    $("#bubbleSVG").css({
      '-webkit-transform' : 'scale(' + $("#vis").width()/WIDTH + ')',
      '-moz-transform'    : 'scale(' + $("#vis").width()/WIDTH + ')',
      '-ms-transform'     : 'scale(' + $("#vis").width()/WIDTH + ')',
      '-o-transform'      : 'scale(' + $("#vis").width()/WIDTH + ')',
      'transform'         : 'scale(' + $("#vis").width()/WIDTH + ')'
    });
  }
}
window.onresize = function(){
  sizeChange();
}
}());
