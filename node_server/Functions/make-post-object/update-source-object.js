/**
 * Modifies the request object in place based on Supply Chain (schain) data.
 * It adjusts the schain object within the request based on the provided schainData.
 * If the original seller ID (sid) from the request's schain is not found in schainData,
 * the schain object is removed from the request to maintain data integrity.
 *
 * @param {Object} request - The request object containing the source and schain information. This object is modified directly.
 * @param {Object} schainData - A mapping of seller IDs (sid) to their corresponding schain information. Used to update or validate the schain in the request.
 */
const config = require('../../configs/config.json');

module.exports = (request, dsp) => {
  switch (dsp.schain) {
    case 0:
      break;
    case 1:
      emptySchain(request);
      break;
    case 2:
      directSchain(request);
      break;
    case 3:
      indirectSchain(request);
      break;
    default:
      directSchain(request);
      break;
  }
};

function directSchain(request) {
  //Retrieve schainData.
  let schainData = global.globalStorage.directSchain;

  //Retrieve appBundle if exist.
  let appBundle = request.app && request.app.bundle ? request.app.bundle.toLowerCase() : null;
  // console.log('Request appBundle: ' + appBundle + "\n" + 'SchainAppBundle: ' + schainData[appBundle]);

  // Check if original sid exists in schainData
  if (!schainData[appBundle]) {
    // Remove schain object if sid not found in schainData
    if (request.source && request.source.ext) {
      delete request.source.ext.schain;
      // Remove source.ext if it's empty after removing schain
      if (Object.keys(request.source.ext).length === 0) {
        delete request.source.ext;
      }
    }
    return; // Exit early as no further processing is needed
  }

  // Ensure the structure of request is correct for adding schain
  if (!request.source) {
    request.source = {};
  }
  if (!request.source.ext) {
    request.source.ext = {};
  }

  // Build the new schain object with the corresponding sid from schainData
  const newSchainNode = {
    asi: config.schain_domain,
    sid: schainData[appBundle],
    rid: request.id, // Assuming request.id is the relevant ID to use here
    hp: 1,
  };

  //Needs to replace either with schain
  request.app.publisher.id = schainData[appBundle];

  const newSchain = {
    ver: "1.0",
    complete: 1,
    nodes: [newSchainNode],
  };

  // Assign the new schain object to the request
  request.source.ext.schain = newSchain;
  // console.log('finalSchain: ' + JSON.stringify(request?.source?.ext?.schain));
}

function indirectSchain(request, schainRules) {
  let appBundle = request.app && request.app.bundle ? request.app.bundle.toLowerCase() : null;
  schainRules = global.globalStorage.inDirectSchain;

  // Check if original sid exists in schainData
  if (!schainRules[appBundle]) {
    // Remove schain object if sid not found in schainData
    if (request.source && request.source.ext) {
      delete request.source.ext.schain;
      // Remove source.ext if it's empty after removing schain
      if (Object.keys(request.source.ext).length === 0) {
        delete request.source.ext;
      }
    }
    return; // Exit early as no further processing is needed
  }

  // Ensure the structure of the request is correct for adding schain
  if (!request.source) {
    request.source = {};
  }
  if (!request.source.ext) {
    request.source.ext = {};
  }

  // Initialize the schain object with default properties
  var schain = {
    ver: "1.0",
    complete: 1,
    nodes: [],
  };

  if (
    !schainRules ||
    !schainRules[appBundle] ||
    !schainRules[appBundle].nodes
  ) {
    //TODO: What we are doing if we don't have an object;
    return;
  }

  // Dynamically add nodes based on the indirect schain rules
  // The rules should be ordered correctly beforehand: Node 1, Node 2, ..., Node 0 (lunamedia.io)
  schainRules[appBundle].nodes.forEach(function (rule) {
    var node = {
      asi: rule.asi,
      sid: rule.sid,
      rid: rule.rid || request.id, // Use provided rid or fall back to request.id
      hp: 1, // Hardcoded as per specification
    };
    if (rule.name !== "") {
      node.name = rule.name;
    }
    if (rule.domain !== "") {
      node.domain = rule.domain;
    }
    schain.nodes.push(node);
  });

  // Assign the newly constructed schain object to the request
  request.source.ext.schain = schain;

  if (schainRules[appBundle]) {
    // Update the app.publisher.id with the sid of the last node (lunamedia.io node)
    if (!request.app) request.app = {};
    if (!request.app.publisher) request.app.publisher = {};

    request.app.publisher.id =
      schainRules[appBundle].nodes[schainRules[appBundle].nodes.length - 1].sid;
  }
}

function emptySchain(request) {
  if (request &&
      request.source &&
      request.source.ext){
    delete request.source.ext.schain;
  }
}