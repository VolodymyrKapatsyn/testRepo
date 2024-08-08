const {PrometheusService} = require("../services/prometheus/prometheus.service");
/**
 * Constant representing the header part of a GeoEdge creative wrapper. This header is pre-defined
 * HTML and script content intended to be prepended to advertisement code for integration with
 * Smaato's ad serving platform. Includes dynamic placeholders for ad unit configuration and
 * tracking parameters.
 * TODO: Should be delivered into a database for dynamic retrieval.
 * @constant
 * @type {string}
 */
const smaatoHeader = `<div id="grumi-container"><script type="text/javascript" nonce="!headerNonce!">window.grumi={wver:"1.1.6",wtype:"dfp",key:"96ed33da-e88a-40ea-bb31-363b6574c0d7",meta:{adup:"%%ADUNIT%%",dest:"%%DEST_URL_ESC%%",w:"%%WIDTH%%",h:"%%HEIGHT%%",li:"%eaid!",adv:"%eadv!",ord:"%ebuy!",cr:"%ecid!",ygIds:"%_ygIds!",aduid:"%epid!",haduid:"%esid!",isAfc:"%_isAfc!",isAmp:"%_isAmp!",isEBDA:"%_isEBDA!",qid:"%qid!",cust_imp:"%cust_imp!",cust1:"%cust1!",cust2:"%cust2!",cust3:"%cust3!",caid:"%caid!",di:"%DEMAND_ID!",dn:"%DEMAND_NAME!",dcid:"%DEMAND_CREATIVE_ID!",pid:"%PUBLISHER_ID!",pn:"%PUBLISHER_NAME!",adElId:"%_adElId!",topUrl:"%%TOPURL%%"},sp:"dfp",cfg:{advs:"%%advs%%",pbGlobal:"%_pbGlobal%"},pbAdId:"%%PATTERN:hb_adid%%",pbAdIdAst:"%%PATTERN:hb_adid_appnexusAst%%",pbBidder:"%%PATTERN:hb_bidder%%",hbPb:"%%PATTERN:hb_pb%%",hbCid:"%_hbcid!",hbAd:"%_hbad!",hbSize:"%%PATTERN:hb_size%%",hbCurrency:"%_hbCurrency!",hbAdomains:"%_hbadomains",site:"%%SITE%%",pimp:"%_pimp%",pl:"%%preloaded%%",isHb:"%_isHb!",to:"%_to%"};</script><template style="display: none;" id="template0"><xmp style="display: none;" id="xmp0">`;
const mintegralHeader = `<div id="grumi-container"><script type="text/javascript" nonce="!headerNonce!">window.grumi={wver:"1.1.6",wtype:"dfp",key:"3319d72e-3615-497f-9b04-acea1c4bde3b",meta:{adup:"%%ADUNIT%%",dest:"%%DEST_URL_ESC%%",w:"%%WIDTH%%",h:"%%HEIGHT%%",li:"%eaid!",adv:"%eadv!",ord:"%ebuy!",cr:"%ecid!",ygIds:"%_ygIds!",aduid:"%epid!",haduid:"%esid!",isAfc:"%_isAfc!",isAmp:"%_isAmp!",isEBDA:"%_isEBDA!",qid:"%qid!",cust_imp:"%cust_imp!",cust1:"%cust1!",cust2:"%cust2!",cust3:"%cust3!",caid:"%caid!",di:"%DEMAND_ID!",dn:"%DEMAND_NAME!",dcid:"%DEMAND_CREATIVE_ID!",pid:"%PUBLISHER_ID!",pn:"%PUBLISHER_NAME!",adElId:"%_adElId!",topUrl:"%%TOPURL%%"},sp:"dfp",cfg:{advs:"%%advs%%",pbGlobal:"%_pbGlobal%"},pbAdId:"%%PATTERN:hb_adid%%",pbAdIdAst:"%%PATTERN:hb_adid_appnexusAst%%",pbBidder:"%%PATTERN:hb_bidder%%",hbPb:"%%PATTERN:hb_pb%%",hbCid:"%_hbcid!",hbAd:"%_hbad!",hbSize:"%%PATTERN:hb_size%%",hbCurrency:"%_hbCurrency!",hbAdomains:"%_hbadomains",site:"%%SITE%%",pimp:"%_pimp%",pl:"%%preloaded%%",isHb:"%_isHb!",to:"%_to%"};</script><template style="display: none;" id="template0"><xmp style="display: none;" id="xmp0">`;
const pubnativeHeader = `<div id="grumi-container"><script type="text/javascript" nonce="!headerNonce!">window.grumi={wver:"1.1.6",wtype:"dfp",key:"04030a1e-0439-4bbb-ae7a-572687587922",meta:{adup:"%%ADUNIT%%",dest:"%%DEST_URL_ESC%%",w:"%%WIDTH%%",h:"%%HEIGHT%%",li:"%eaid!",adv:"%eadv!",ord:"%ebuy!",cr:"%ecid!",ygIds:"%_ygIds!",aduid:"%epid!",haduid:"%esid!",isAfc:"%_isAfc!",isAmp:"%_isAmp!",isEBDA:"%_isEBDA!",qid:"%qid!",cust_imp:"%cust_imp!",cust1:"%cust1!",cust2:"%cust2!",cust3:"%cust3!",caid:"%caid!",di:"%DEMAND_ID!",dn:"%DEMAND_NAME!",dcid:"%DEMAND_CREATIVE_ID!",pid:"%PUBLISHER_ID!",pn:"%PUBLISHER_NAME!",adElId:"%_adElId!",topUrl:"%%TOPURL%%"},sp:"dfp",cfg:{advs:"%%advs%%",pbGlobal:"%_pbGlobal%"},pbAdId:"%%PATTERN:hb_adid%%",pbAdIdAst:"%%PATTERN:hb_adid_appnexusAst%%",pbBidder:"%%PATTERN:hb_bidder%%",hbPb:"%%PATTERN:hb_pb%%",hbCid:"%_hbcid!",hbAd:"%_hbad!",hbSize:"%%PATTERN:hb_size%%",hbCurrency:"%_hbCurrency!",hbAdomains:"%_hbadomains",site:"%%SITE%%",pimp:"%_pimp%",pl:"%%preloaded%%",isHb:"%_isHb!",to:"%_to%"};</script><template style="display: none;" id="template0"><xmp style="display: none;" id="xmp0">`;
/**
 * Constant representing the footer part of a GeoEdge creative wrapper. This footer contains
 * script logic for post-processing or cleanup tasks related to the ad content, ensuring proper
 * communication and functionality within the ad serving environment.
 * TODO: Should be delivered into a database for dynamic retrieval.
 * @constant
 * @type {string}
 */
const smaatoFooter = `</xmp></template><script type="text/javascript" nonce="!footerNonce!">!function(n){var e=window.grumi.key,t=window.grumi,o=t&&t.wtype&&"gpt"===t.wtype,r=window.onerror,i=+new Date,a=navigator.userAgent&&navigator.userAgent.match(/(MSIE)|(Trident)|(Edg)/),w=o&&!a,o=t.to,o=parseInt(o,10)||5e3;function u(){var n=function(){for(var n,e=document.getElementsByTagName("template"),t=e.length-1;0<=t;t--)if("template0"===e[t].id){n=e[t];break}return n}();return n.content?n.content.getElementById?n.content.getElementById("xmp0"):n.content.childNodes[0]:n.getElementsByTagName("xmp")[0]}function d(){var n=u();return n&&n.innerHTML}function c(n,e){e=e||!1,window.parent.postMessage&&window.parent.postMessage({evType:n||"",key:t.key,adup:t.meta.adup,html:window.grumi?window.grumi.tag:"",el:t.meta.adElId,refresh:e},"*")}var m=!1;function g(n,e){var t,o;!m&&(m=!0,t="",o=a&&"complete"===document.readyState,window.grumi&&(window.grumi.fsRan=!0,t=window.grumi.tag),o||(t=t||d(),w&&window.document.open(),window.document.write(t),window.document.close()),(e=e||!1)||o)&&c(n,o)}function s(n,t){return function(){var e=setTimeout(function(){var n=document.getElementById(i);n&&null===function(n){if(void 0!==n.nextElementSibling)return n.nextElementSibling;for(var e=n.nextSibling;e&&1!==e.nodeType;)e=e.nextSibling;return e}(n)&&t&&t(),clearTimeout(e)},n)}}s(o,function(){g()})(),s(2e3,function(){c("slwCl")})(),window.grumi.tag=d(),window.grumi.scriptHost=n,window.grumi.pbGlobal=window.grumi.cfg&&window.grumi.cfg.pbGlobal||"pbjs",window.grumi.onerror=r,window.parent&&window.parent.postMessage&&window.parent.postMessage({iw:!0,key:t.key,adup:t.meta.adup,el:t.meta.adElId},"*"),window.grumiInstance=function(){for(var n=window,e=0;e<10;e++){try{if(n.grumiInstance)return n.grumiInstance}catch(n){}n=n.parent}}()||{q:[]};var p=JSON.parse(JSON.stringify(window.grumi));if(grumiInstance.q.push(function(){grumiInstance.createInstance(window,document,p)}),!grumiInstance.loaded){o=document.createElement("script"),n=(o.type="text/javascript",o.src=n+e+"/grumi.js",o.className="rm",o.id=i,w&&(o.async=!0),"_"+ +new Date);window[n]=function(){g("netErr",!0)},window.grumi.start=+new Date;try{window.document.write(o.outerHTML.replace('class="rm"','onerror="'+n+'();"'))}catch(n){g()}}window.onerror=function(n){"function"==typeof r&&r.apply(this,arguments),s(0,g)(),window.onerror=r}}(("http"===window.location.protocol.substr(0,4)?window.location.protocol:"https:")+"//rumcdn.geoedge.be/");</script></div>`;
const mintegralFooter = `</xmp></template><script type="text/javascript" nonce="!footerNonce!">!function(n){var e=window.grumi.key,t=window.grumi,o=t&&t.wtype&&"gpt"===t.wtype,r=window.onerror,i=+new Date,a=navigator.userAgent&&navigator.userAgent.match(/(MSIE)|(Trident)|(Edg)/),w=o&&!a,o=t.to,o=parseInt(o,10)||5e3;function u(){var n=function(){for(var n,e=document.getElementsByTagName("template"),t=e.length-1;0<=t;t--)if("template0"===e[t].id){n=e[t];break}return n}();return n.content?n.content.getElementById?n.content.getElementById("xmp0"):n.content.childNodes[0]:n.getElementsByTagName("xmp")[0]}function d(){var n=u();return n&&n.innerHTML}function c(n,e){e=e||!1,window.parent.postMessage&&window.parent.postMessage({evType:n||"",key:t.key,adup:t.meta.adup,html:window.grumi?window.grumi.tag:"",el:t.meta.adElId,refresh:e},"*")}var m=!1;function g(n,e){var t,o;!m&&(m=!0,t="",o=a&&"complete"===document.readyState,window.grumi&&(window.grumi.fsRan=!0,t=window.grumi.tag),o||(t=t||d(),w&&window.document.open(),window.document.write(t),window.document.close()),(e=e||!1)||o)&&c(n,o)}function s(n,t){return function(){var e=setTimeout(function(){var n=document.getElementById(i);n&&null===function(n){if(void 0!==n.nextElementSibling)return n.nextElementSibling;for(var e=n.nextSibling;e&&1!==e.nodeType;)e=e.nextSibling;return e}(n)&&t&&t(),clearTimeout(e)},n)}}s(o,function(){g()})(),s(2e3,function(){c("slwCl")})(),window.grumi.tag=d(),window.grumi.scriptHost=n,window.grumi.pbGlobal=window.grumi.cfg&&window.grumi.cfg.pbGlobal||"pbjs",window.grumi.onerror=r,window.parent&&window.parent.postMessage&&window.parent.postMessage({iw:!0,key:t.key,adup:t.meta.adup,el:t.meta.adElId},"*"),window.grumiInstance=function(){for(var n=window,e=0;e<10;e++){try{if(n.grumiInstance)return n.grumiInstance}catch(n){}n=n.parent}}()||{q:[]};var p=JSON.parse(JSON.stringify(window.grumi));if(grumiInstance.q.push(function(){grumiInstance.createInstance(window,document,p)}),!grumiInstance.loaded){o=document.createElement("script"),n=(o.type="text/javascript",o.src=n+e+"/grumi.js",o.className="rm",o.id=i,w&&(o.async=!0),"_"+ +new Date);window[n]=function(){g("netErr",!0)},window.grumi.start=+new Date;try{window.document.write(o.outerHTML.replace('class="rm"','onerror="'+n+'();"'))}catch(n){g()}}window.onerror=function(n){"function"==typeof r&&r.apply(this,arguments),s(0,g)(),window.onerror=r}}(("http"===window.location.protocol.substr(0,4)?window.location.protocol:"https:")+"//rumcdn.geoedge.be/");</script></div>`;
const pubnativeFooter = `</xmp></template><script type="text/javascript" nonce="!footerNonce!">!function(n){var e=window.grumi.key,t=window.grumi,o=t&&t.wtype&&"gpt"===t.wtype,r=window.onerror,i=+new Date,a=navigator.userAgent&&navigator.userAgent.match(/(MSIE)|(Trident)|(Edg)/),w=o&&!a,o=t.to,o=parseInt(o,10)||5e3;function u(){var n=function(){for(var n,e=document.getElementsByTagName("template"),t=e.length-1;0<=t;t--)if("template0"===e[t].id){n=e[t];break}return n}();return n.content?n.content.getElementById?n.content.getElementById("xmp0"):n.content.childNodes[0]:n.getElementsByTagName("xmp")[0]}function d(){var n=u();return n&&n.innerHTML}function c(n,e){e=e||!1,window.parent.postMessage&&window.parent.postMessage({evType:n||"",key:t.key,adup:t.meta.adup,html:window.grumi?window.grumi.tag:"",el:t.meta.adElId,refresh:e},"*")}var m=!1;function g(n,e){var t,o;!m&&(m=!0,t="",o=a&&"complete"===document.readyState,window.grumi&&(window.grumi.fsRan=!0,t=window.grumi.tag),o||(t=t||d(),w&&window.document.open(),window.document.write(t),window.document.close()),(e=e||!1)||o)&&c(n,o)}function s(n,t){return function(){var e=setTimeout(function(){var n=document.getElementById(i);n&&null===function(n){if(void 0!==n.nextElementSibling)return n.nextElementSibling;for(var e=n.nextSibling;e&&1!==e.nodeType;)e=e.nextSibling;return e}(n)&&t&&t(),clearTimeout(e)},n)}}s(o,function(){g()})(),s(2e3,function(){c("slwCl")})(),window.grumi.tag=d(),window.grumi.scriptHost=n,window.grumi.pbGlobal=window.grumi.cfg&&window.grumi.cfg.pbGlobal||"pbjs",window.grumi.onerror=r,window.parent&&window.parent.postMessage&&window.parent.postMessage({iw:!0,key:t.key,adup:t.meta.adup,el:t.meta.adElId},"*"),window.grumiInstance=function(){for(var n=window,e=0;e<10;e++){try{if(n.grumiInstance)return n.grumiInstance}catch(n){}n=n.parent}}()||{q:[]};var p=JSON.parse(JSON.stringify(window.grumi));if(grumiInstance.q.push(function(){grumiInstance.createInstance(window,document,p)}),!grumiInstance.loaded){o=document.createElement("script"),n=(o.type="text/javascript",o.src=n+e+"/grumi.js",o.className="rm",o.id=i,w&&(o.async=!0),"_"+ +new Date);window[n]=function(){g("netErr",!0)},window.grumi.start=+new Date;try{window.document.write(o.outerHTML.replace('class="rm"','onerror="'+n+'();"'))}catch(n){g()}}window.onerror=function(n){"function"==typeof r&&r.apply(this,arguments),s(0,g)(),window.onerror=r}}(("http"===window.location.protocol.substr(0,4)?window.location.protocol:"https:")+"//rumcdn.geoedge.be/");</script></div>`;
/**
 * Attempts to wrap the provided advertisement code (`admCode`) with pre-defined header and footer
 * based on the configuration of the SSP (Supply-Side Platform) and DSP (Demand-Side Platform).
 * This operation is conditional based on the presence of `ssp`, `dsp`, and `admCode` parameters,
 * as well as specific SSP configurations and GeoEdge settings. Additionally, it increments a counter
 * in Prometheus to track the usage of the GeoEdge feature.
 *
 * @param {Object} ssp - The SSP configuration object, containing information such as its ID and GeoEdge settings.
 * @param {Object} dsp - The DSP (Demand-Side Platform) configuration object, expected to at least contain an ID.
 * @param {string} crid -
 * @param {string} admCode - The advertisement code that may be wrapped with additional content.
 * @returns {string} Logs an error if required parameters are missing or if no operation is performed. Otherwise,
 * updates `admCode` and return with the wrapped content and logs the operation along with incrementing the Prometheus counter.
 * @example
 * // Example usage:
 * module.exports(sspObject, dspObject, "yourAdCodeHere");
 * // This would wrap "yourAdCodeHere" with predefined header and footer if conditions are met, log the operation,
 * // and increment a Prometheus metric.
 */
module.exports = (ssp, dsp, crid, admCode) => {
    if (!ssp || !dsp || !admCode || !crid) {
        console.warn(
            `GeoEdge error: Missing one or more parameters (ssp: ${ssp}, dsp: ${dsp}, admCode: ${admCode}, crid: ${crid})`
        );
        return admCode;
    }
    const randomNum = Math.floor(Math.random() * 100) + 1;

    const applyGeoEdgeScanning = (header, footer) => {
        if (ssp.geo_edge_scanning >= randomNum) {
            admCode = AddAdmHeaderFooter(replaceMacros(header, ssp, dsp, crid), admCode, footer);
            PrometheusService.getInstance().inc("ad_ex_geoEdge_count", {
                sspId: ssp.id,
                dspId: dsp.id,
            });
        }
    };

    PrometheusService.getInstance().inc("geo_edge_all", {
        sspId: ssp.id,
        dspId: dsp.id,
    });

    switch (ssp.company) {
        case 'smaato':
            applyGeoEdgeScanning(smaatoHeader, smaatoFooter);
            break
        case 'mintegral':
            applyGeoEdgeScanning(mintegralHeader, mintegralFooter);
            break;
        default:
            applyGeoEdgeScanning(pubnativeHeader, pubnativeFooter);
            break;
    }
    return admCode
};

/**
 * Concatenates the provided header, advertisement code, and footer to form a complete
 * advertisement block. This function facilitates the dynamic integration of ads with
 * additional content and scripts necessary for advanced ad serving features and tracking.
 *
 * @param {string} header - The pre-defined header content including initial scripts and setup logic.
 * @param {string} admCode - The core advertisement code that is the target for the header and footer wrapping.
 * @param {string} footer - The pre-defined footer content including cleanup scripts and post-processing logic.
 * @returns {string} The fully concatenated string comprising the header, advertisement code, and footer.
 */
function AddAdmHeaderFooter(header, admCode, footer) {
    if (header && footer) {
        return header + admCode + footer;
    }
}

/**
 * Replaces specific placeholders within the input string with the respective values from the given parameters.
 *
 * This function searches for placeholders indicating demand ID, demand creative ID, and publisher ID, and replaces them
 * with the provided `ssp.id`, `crid`, and `dsp.id` values, respectively. It supports global replacement within the string.
 *
 * @param {string} input - The input string containing placeholders to be replaced.
 * @param {Object} ssp - The supply-side platform object with an `id` property.
 * @param {Object} dsp - The demand-side platform object with an `id` property.
 * @param {string} crid - The creative ID to replace the demand creative ID placeholder.
 * @returns {string} The input string with all placeholders replaced with their respective values.
 */
function replaceMacros(input, ssp, dsp, crid) {
    return input
        .replace("%DEMAND_ID!", dsp.id)
        .replace("%DEMAND_CREATIVE_ID!", crid)
        .replace("%PUBLISHER_ID!", ssp.id);
}
