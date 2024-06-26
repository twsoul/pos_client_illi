/**
 * Created by Jo on 2022. 7. 11..
 */
var upperManager = (function() {
    var getUPPER = userManager.getUPPER();
    var Upper = function(scan) {
        var barcode = scan;
        if(getUPPER == "Y"){
           barcode = barcode.toUpperCase();
        }
        return barcode;
    }
    return {
        Upper: Upper
    }
})();