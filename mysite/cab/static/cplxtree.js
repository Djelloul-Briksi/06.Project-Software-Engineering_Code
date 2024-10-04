// the chart dimensions (the width and height are variable, depending on the layout, i.e number of nodes)
const marginTop = 50;
const marginRight = 50;
const marginBottom = 50;
const marginLeft = 40;

// dimension of one rect to show one action (is the base for all visualizations)
const baseWidth = 180
const baseHeight = 40

const dHor = (baseWidth / 2);   // horizontal distance between nodes
const dVer = (baseHeight / 2);   // vertical distance between nodes

// svg containers (globlal, to be accessed everywhere)
var svg;
var gLink;
var gNode;


/**
 * Entry point: make the complex action tree, from the specified json-file (tree)
 */
function makeTree() {

  d3.json( "719.json" ).then( function( data ) {
    drawTree(data);
  } );
}


/**
 * Draws a complex action tree
 * @param {json} data 
 */
function drawTree(data) {

  // build the tree hierarchy (while indexing all nodes)
  const root = d3.hierarchy(data).eachBefore((i => d => d.index = i++)(0));
  //console.log("root", root);
        
  // the SVG container
  svg = d3.select("#svgCplxTree")
      .attr("width", baseWidth)
      .attr("height", baseHeight)
      .attr("style", "font: 10px sans-serif; overflow: visible");

  // layer for the links
  gLink = svg.append("g")
      .attr("fill", "none")
      .attr("stroke", "#555")
      .attr("stroke-opacity", 0.4)
      .attr("stroke-width", 1);

  // layer for the nodes
  gNode = svg.append("g")
      .attr("cursor", "pointer")
      .attr("pointer-events", "all");

  // do the first update: show the whole tree
  root.x0 = 0;
  root.y0 = 0;
  root.descendants().forEach((d, i) => {
    d.id = i;
    d._children = d.children;
  });

  update(null, root, root);
}


/**
 * Updates the tree
 * @param {event} event - mouse event
 * @param {d3 object} source - source node which was last selected (clicked)
 * @param {d3 object} root - root node
 */
function update(event, source, root) {
  const start = Date.now();
  const duration = event?.altKey ? 2500 : 200; // hold the alt key to slow down the transition
  
  const nodes = root.descendants();
  const links = root.links();
  //console.log("nodes", nodes);
  //console.log("links", links);

  // compute the position of each node
  let maxIndex = 0;   // the maximum index ('nodes in y-directions')
  let maxDepth = 0;   // the maximum depth ('nodes in x-directions')
  root.eachBefore(function(d, i) {
    //console.log("i", i, d);
    d.y = d.depth * dHor / 1.5;
    d.x = i * (dVer + baseHeight);
    if (i > maxIndex) maxIndex = i;
    if (d.depth > maxDepth) maxDepth = d.depth;
  });
  //console.log("nodes", nodes);
  //console.log("maxIndex, maxDepth: ", maxIndex, maxDepth);

  var width = dHor * (maxDepth + 1) + dHor;
  var height = (baseHeight + dVer) * (maxIndex + 1);
  //console.log("width, height: ", width, height);

  const transition = svg.transition()
      .duration(duration)
      .attr("height", height)
      .attr("width", width)
      .attr("viewBox", [-dHor, -dVer, width, height])
      .attr("preserveAspectRatio", "xMinYMid");

  // Update the nodes…
  const node = gNode.selectAll("g")
    .data(nodes, d => d.id);

  // Enter any new nodes at the parent's previous position.
  const nodeEnter = node.enter().append("g")
      .attr("transform", d => `translate(${source.y0},${source.x0})`)
      .attr("fill-opacity", 0)
      .attr("stroke-opacity", 0)
      .on("click", (event, d) => {
        d.children = d.children ? null : d._children;
        update(event, d, root);
      })
      .on( "mouseenter mouseleave", function(e) {
        showDetails(d3.select(this).node(), e);
      });

  nodeEnter.append( "rect" ).attr( "rx", 5 ).attr( "ry", 5 )          
    .attr( "width", baseWidth ).attr( "height", baseHeight )
    .attr( "x", -(baseWidth / 2) ).attr( "y", -(baseHeight / 2) )
    .attr( "fill", getActionColor )
    .attr( "stroke", "steelblue" )
    .attr( "stroke-width", 0.3 )
    .classed( "frame", true );                                

  nodeEnter.append( "text" ).attr( "x", 0 ).attr( "y", -7 )
    .attr( "text-anchor", "middle" )
    .attr( "font-family", "Verdana" )
    .attr( "font-size", 13 )
    .attr( "fill", d3.color("darkslategray") )
    .classed( "label", true )
    .text( d=> d.data.type );

    nodeEnter.append( "text" ).attr( "x", 0 ).attr( "y", 4 )
    .attr( "text-anchor", "middle" )
    .attr( "font-family", "Verdana" )
    .attr( "font-size", 10 )
    .attr( "fill", d3.color("darkslategray") )
    .attr( "opacity", 0.8)
    .classed( "label", true )
    .text( getCAAttribute );

    nodeEnter.append( "text" ).attr( "x", 0 ).attr( "y", 15 )
    .attr( "text-anchor", "middle" )
    .attr( "font-family", "Verdana" )
    .attr( "font-size", 11 )
    .attr( "fill", d3.color("darkslategray") )
    .classed( "label", true )
    .text( getActionId );

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
      const o = {x: source.x0, y: source.y0};
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

  // Stash the old positions for transition.
  root.eachBefore(d => {
    d.x0 = d.x;
    d.y0 = d.y;
  });

  const end = Date.now();
  console.log(`Updated nodes in: ${end - start} ms`);
}


/**
 * Draw a link (curved line) between two nodes
 * d: d3-data
 */
function drawLink(d) {
  //console.log("line", d);
  var line = d3.line().curve( d3.curveBasis );
  var ds = [ 
    [d.source.y - (baseWidth / 3), d.source.x],     // start point
    [d.source.y - (baseWidth / 3), d.target.x],     // intermediate point
    [d.target.y - (baseWidth / 3), d.target.x] ];   // end point
  //console.log(line(ds));
  return(line(ds));
}


/**
 * Show Action Details
 */
function showDetails(selNode, event) {
  //console.log("showDetails");
  if (event.type == "mouseenter") {
    // add details but let them invisible
    var details = d3.select(selNode).append( "g" )
      .attr("id", "details")
      .attr("visibility", "hidden")
      .attr( "fill", d3.color("steelblue") )
      .attr( "font-family", "courier" )
      .attr( "font-size", 10 )
      .attr( "text-anchor", "left" )
      .classed( "label", true );

      details.append( "text" ).attr("x", "100").attr("y", "-21")
      .text( getActionDetailId );

      details.append( "text" ).attr("x", "100").attr("y", "-12")
      .text( getActionType );

    details.append( "text" ).attr("x", "100").attr("y", "-2")
      .text( getMediaType );

    details.append( "text" ).attr("x", "100").attr("y", "8")
      .text( getReportStart );

    details.append( "text" ).attr("x", "100").attr("y", "18")
      .text( getReportEnd );

    details.append( "text" ).attr("x", "100").attr("y", "28")
      .text( getCategories );

    // show details only after some seconds (effect of a tooltip)
    details.transition().delay(1000).attr("visibility", "visible");     
  }
  else if (event.type == "mouseleave") {
    d3.select(selNode).selectAll("#details").remove();
  }
}


/**
 * Getter functions to get data items content or setting
 */

function getCAAttribute(d) {
  var text = "";
  
  if ( (d.data.type == "ExactTime") || (d.data.type == "MaxTime") || (d.data.type == "MinTime") ) {
    text = "(time: ";
    if (d.data.CA_Time == "-1") {
      text += "infinite";
    }
    else {
      text += d.data.CA_Time;
      text += "s";
    }
    text += ")";
  }

  else if (d.data.type == "Repeat") {
    text = "(count: ";
    if (d.data.CA_Count == "-1") {
      text += "infinite";
    }
    else {
      text += d.data.CA_Count;
    }
    text += ")";
  }

  else if ( (d.data.type == "EnableByExtSource") || (d.data.type == "CancelByExtSource") || (d.data.type == "EnabeleOnceByExtSource")) {
    text = "(";
    text += d.data.CA_ExtSource;
    text += ")";
  }

  return text;
}

function getActionId(d) {
  var text = "ActId:" + d.data.actionId;
  return (text);
}

function getActionDetailId(d) {
  var text = "ActDetId: " + d.data.actionDetailId;
  return (text);
}

function getActionType(d) {
  var text = "ActTyp: " + d.data.actionType;
  return (text);
}

function getMediaType(d) {
  var text = "MedTyp: " + d.data.mediaType;
  return (text);
}

function getReportStart(d) {
  var text = "-";
  if (d.data.CA_ReportStart) { text = d.data.CA_ReportStart; }
  return ("ReportStart: " + text)
}

function getReportEnd(d) {
  var text = "-";
  if (d.data.CA_ReportEnd) { text = d.data.CA_ReportEnd; }
  return ("ReportEnd: " + text)
}

function getCategories(d) {
  var text = "";
  if (d.data.CA_CategoryName) { text = "Cat: " + d.data.CA_CategoryName; }
  return (text)
}

function getActionColor(d) {
  if ((d.data.type == "Display") || (d.data.type == "Announcement") || (d.data.type == "Screen") || (d.data.type == "Customerspec"))  {
    return "ivory";
  }
  return "linen";
}

/**
 * entry point of the cplxaction.html page
 */
function cplxtree() {

  //console.log("cplxtree: main")

  const queryString = window.location.search;
  const urlParams = new URLSearchParams(queryString);
  const actionId = urlParams.get('actId');
  const actionListId = urlParams.get('actLstId');
  const actionDetailId = urlParams.get('actDetId');
  const actionType = urlParams.get('actTyp');
  const mediaType = urlParams.get('medTyp');
  //console.log(actionId, actionListId, actionDetailId, actionType, mediaType);

  // url of the django endpoint
  //const url = 'http://127.0.0.1:8000/cab/getcplxaction';
  const url = '/cab/getcplxaction';

  // form the data (file) to send
  const data = {
      'actionId' : actionId,
      'actionListId' : actionListId,
      'actionDetailId' : actionDetailId,
      'actionType' : actionType,
      'mediaType' : mediaType
  };

  // Send a post request to the django server
  fetch(url, {
      method: 'POST',
      headers: {
          'Content-Type': 'application/json'
      },
      body: JSON.stringify(data) // Convert the data to a JSON string
  })
  .then(response => {
      if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
      }
      return response.json(); // Parse the response as JSON
  })
  .then(data => {
      //console.log(data)
      data = JSON.parse(data);

      if (data.hasOwnProperty("exception")) {
        throw new Error(`cannot uploadDbFile: ${data['exception']}`);
      }

      drawTree(data);
  })
  .catch(error => {
      // Handle errors here
      console.error(error);
  });
}