// the chart dimensions (the width and height are variable, depending on the layout, i.e number of nodes)
const marginTop = 50;
const marginRight = 50;
const marginBottom = 50;
const marginLeft = 50;

// dimension of one rect to show one action (is the base for all visualizations)
const baseWidth = 180
const baseHeight = 30

const dHor = (baseWidth / 2);    // horizontal distance between nodes
const dVer = (baseHeight / 5);   // vertical distance between nodes

// svg containers (globlal, to be accessed everywhere)
var svg;
var gLink;
var gNode;


/**
 * Draws train number actions, including sections and events
 * @param {json} data 
 */
function drawTnActions(data) {

  // build the tree hierarchy (while indexing all nodes)
  const root = d3.hierarchy(data).eachBefore((i => d => d.index = i++)(0));
  //console.log(root);
        
  // the SVG container
  svg = d3.select("#svgTnActions")
      .attr("width", baseWidth)
      .attr("height", baseHeight)
      .attr("style", "font: 10px sans-serif; overflow: visible");
  //console.log(svg);

  // layer for the links
  gLink = svg.append("g")
      .attr("fill", "none")
      .attr("stroke-opacity", 0.4)
      .attr("stroke-width", 1)
      .attr( "stroke", "gray" );

  // layer for the nodes
  gNode = svg.append("g");

  update(root, root);
}


/**
 * Updates the tree
 * @param {d3 object} source - source node which was last selected (clicked)
 * @param {d3 object} root - root node
 */
function update(source, root) {
  
  const nodes = root.descendants();
  const links = root.links();
  //console.log("nodes", nodes);
  //console.log("links", links);

  // compute the position of each node
  let maxIndex = 0;   // the maximum index ('nodes in y-directions')
  let maxDepth = 0;   // the maximum depth ('nodes in x-directions')
  var horIndex = 0;
  var verIndex = 0;
root.eachBefore(function(d) {
    //console.log(d.index, horIndex, verIndex, d);
    if (d.data.childType == "action") {
      d.y = d.parent.y + baseWidth + 20 + horIndex * (baseWidth + 20);
      d.x = d.parent.x; 
      horIndex ++;
    }
    else {
      d.y = d.depth * dHor;
      d.x = verIndex * (dVer + baseHeight);
      horIndex = 0;
      verIndex ++;
    }
    if (d.index > maxIndex) maxIndex = d.index;
    if (d.depth > maxDepth) maxDepth = d.depth;
  });
  //console.log("nodes", nodes);
  //console.log("maxIndex, maxDepth: ", maxIndex, maxDepth);

  var width = (baseWidth + dHor) * (horIndex + 1) + dHor;
  var height = (baseHeight + dVer) * (verIndex + 1) + dVer;
  //console.log("width, height: ", width, height);

  const transition = svg.transition()
      .attr("height", height)
      .attr("width", width)
      .attr("viewBox", [-dHor, -baseHeight, width, height]);

  // Update the nodes…
  const node = gNode.selectAll("g")
    .data(nodes, d => d.id);

  // Enter any new nodes at the parent's previous position.
  const nodeEnter = node.enter().append("g")
      .attr("transform", d => `translate(${source.y},${source.x})`)
      .attr("fill-opacity", 0)
      .attr("stroke-opacity", 0)
      .attr("cursor", setCurstor )
      .on("click", (event, d) => { selectAction(d); });

  nodeEnter.append( "rect" ).attr( "rx", 3 ).attr( "ry", 3 )
    .attr( "width", baseWidth ).attr( "height", baseHeight )
    .attr( "x", -(baseWidth / 2) ).attr( "y", -(baseHeight / 2) )
    .attr( "fill", getBoxColor )
    .attr( "stroke", "steelblue" )
    .attr( "stroke-width", 0.1 )
    .classed( "frame", true );                                

  nodeEnter.append( "text" ).attr( "x", 0 ).attr( "y", -2 )
    .attr( "text-anchor", "middle" )
    .attr( "font-family", "Verdana" )
    .attr( "font-size", 13 )
    .attr( "fill", "darkslategray" )
    .classed( "label", true )
    .text( getContentLine1 );

    nodeEnter.append( "text" ).attr( "x", 0 ).attr( "y", 11 )
    .attr( "text-anchor", "middle" )
    .attr( "font-family", "Courier New" )
    .attr( "font-size", 12 )
    .attr( "fill", "darkslategray" )
    .attr( "opacity", 0.9)
    .classed( "label", true )
    .text( getContentLine2 );

  // Transition nodes to their new position.
  const nodeUpdate = node.merge(nodeEnter).transition(transition)
      .attr("transform", d => `translate(${d.y},${d.x})`)
      .attr("fill-opacity", 1)
      .attr("stroke-opacity", 1);

  // Transition exiting nodes to the parent's new position.
  const nodeExit = node.exit().transition(transition).remove()
      .attr("transform", d => `translate(${source.y},${source.x})`)
      .attr("fill-opacity", 0)
      .attr("stroke-opacity", 0);

  // Update the links…
  const link = gLink.selectAll("path")
  .data(links, d => d.target.id);

  // Enter any new links at the parent's previous position
  const linkEnter = link.enter().append("path")
    .attr("d", d => {
      const o = {x: source.x, y: source.y};
      return drawLink({source: o, target: o});
    });

  // Transition links to their new position.
  link.merge(linkEnter).transition(transition)
      .attr("d", drawLink);

  link.exit().transition(transition).remove()
    .attr("d", d => {
      const o = {x: source.x, y: source.y};
      return drawLink({source: o, target: o});
    });
}


/**
 * Draw a link (curved line) between two nodes
 * d: d3-data
 */
function drawLink(d) {
  //console.log("line", d);
  if ((d.source.data) && (d.source.data.childType)) {
    if ((d.source.data.childType == "trainNumber") || (d.source.data.childType == "lineEvent")) {
      var line = d3.line().curve( d3.curveBumpY );
      var ds = [ 
        [d.source.y - (baseWidth / 4), d.source.x],     // start point
        [d.source.y - (baseWidth / 4), d.target.x],     // intermediate point
        [d.target.y - (baseWidth / 4), d.target.x] ];   // end point
      //console.log(line(ds));
      return(line(ds));
    }
  }
  return;
}


/**
 * Getter functions to get data items content or setting (e.g color)
 */
function getContentLine1(d) {
  var text = ""
  if (d.data.childType == "trainNumber") {
    text = "TrainNumber: '" + d.data.trainNumberShortName + "'";
  }
  else if (d.data.childType == "lineSection") {
    if (d.data.lineSectionType == 2) {
      text = "Init";
    }
    else if (d.data.lineSectionType == 1) {
      text = d.data.fromStation + " (" + d.data.fromStationAbbr + ")";
    }
  }
  if (d.data.childType == "lineEvent") {
    text = d.data.trigger;
  }
  if (d.data.childType == "action") {
    text = "ActionID: " + d.data.actionId;
  }

  return text;
}

function getContentLine2(d) {
  var text = ""
  if (d.data.childType == "trainNumber") {
    text = "TrainNumberID: " + d.data.trainNumberId;
  }
  else if (d.data.childType == "lineSection") {
    text = "LineSectionID: " + d.data.lineSectionId;
  }
  if (d.data.childType == "lineEvent") {
    text = "ActionListID: " + d.data.actionListId;
  }
  if (d.data.childType == "action") {
    text = d.data.actionType;
  }

  return text;
}

function getBoxColor(d) {
  var color = "lightgray";
  if (d.data.childType == "lineSection") {
    color = "lightsteelblue"
  }
  else if (d.data.childType == "lineEvent") {
    color = "lightblue"
  }
  else if (d.data.childType == "action") {
    if (
      (d.data.actionType == "CAStatic") ||
      (d.data.actionType == "CANonstatic") ||
      (d.data.actionType == "CANonstatic")) {
        color = "linen";
      }
    else {
      color = "ivory";
    }
  }
  return color;
}


function setCurstor(d) {
  if (d.data.childType == "action") {
    if (
      (d.data.actionType == "CAStatic") ||
      (d.data.actionType == "CANonstatic") ||
      (d.data.actionType == "CANonstatic")) {
        return "pointer";
      }
  }

  return "auto";
}

/**
 * Handles selection an action
 * @param {d3 data} d 
 */
function selectAction(d) {
  //console.log(d); 
  if (d.data.childType == "action") {
    if (
      (d.data.actionType == "CAStatic") ||
      (d.data.actionType == "CANonstatic") ||
      (d.data.actionType == "CANonstatic")) {
        selectCplxAction(
          d.data.actionId,
          d.parent.data.actionListId,
          d.data.actionDetailId,
          d.data.actionType,
          d.data.mediaType
        );
    }
  }
}

/**
 * Handles receiving train number actions
 * @param {json} data 
 */
function gotActions(data) {
  //console.log("gotActions:", data);

  // draw the train number actions
  drawTnActions(data);

  // make divs visible
  d3.select("#divSelectCplx")
    .attr("style", "visibility: visible");
  d3.select("#divTnActions")
    .attr("style", "visibility: visible");
}