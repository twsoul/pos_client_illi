/**
 * Created by KangHyungWon on 2016. 1. 12..
 */


/**
 * Util 메서드 모음
 * @type {{addCommas, removeCommas, toNumber, toRound, toFixed, isJson, isNumeric, isArray, isFunction, isPlainObject}}
 */
var Utils = (function(window, document, $, undefined, M) {
	return {
		/**
		 * 숫자에 3자리마다 ,추가
		 * @param x
		 * @returns {String} Commas가 포함된 숫자
		 */
		addCommas: function(x) {
			var y = '';
			x = x.toString();

			if ( x.indexOf('.') > -1 ) {
				var split = x.split('.');
				x = split[0];
				y = split[1];
			}

			if ( y ) {
				return x.replace(/\B(?=(\d{3})+(?!\d))/g, ",") + '.' + y;
			} else {
				return x.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
			}
		},

		/**
		 * 숫자에 들어간 Commas를 제가한다
		 * @param x
		 * @returns {String} Commas가 제거된 숫자
		 */
		removeCommas : function(x) {
			return x.replace(/\,/gi, '');
		},

		/**
		 * Type Change
		 */

		/**
		 * toNumber
		 * @param str
		 */
		toNumber : function(str) {
			return str*1;
		},

		/**
		 * toRound
		 * @param {Number} value Round 처리할 숫자
		 * @param {Number} decimals 자릿수
		 */
		toRound : function(value, decimals) {
			return Number(Math.round(value+'e'+decimals)+'e-'+decimals).toFixed(decimals) * 1;
		},

		/**
		 * toFixed
		 * @param {Number} value Round 처리할 숫자
		 * @param {Number} decimals 자릿수
		 */
		toFixed: function(value, decimals) {
			var divideNum = 1;

			if ( isNaN(parseFloat(value)) ) {
				return NaN;
			}

			for ( var i = 0; i < decimals; i ++ ) {
				divideNum *= 10;
			}

			return Math.floor(divideNum * parseFloat(value)) / divideNum;
		},

		/**
		 * Type Checker
		 */

		/**
		 * 해당 객체가 Valid 한 JSON 객체인지 체크한다.
		 * @param str
		 * @returns {boolean}
		 */
		isJson: function(str) {
			try {
				JSON.parse(str);
			} catch (e) {
				return false;
			}

			return true;
		},

		/**
		 *
		 * @param obj
		 * @returns {boolean}
		 */
		isNumeric: function( obj ) {
			return !$.isArray( obj ) && (obj - parseFloat( obj ) + 1) >= 0;
		},

		/**
		 *
		 * @returns {*}
		 */

		isArray: function() {
			return $.isArray(arguments);
		},

		/**
		 *
		 * @returns {*}
		 */
		isFunction: function() {
			return $.isFunction(arguments);
		},

		/**
		 *
		 * @returns {*}
		 */
		isPlainObject: function() {
			return $.isPlainObject(arguments);
		},
		
		trim: function(val) {
			return val.replace(/(^\s*)|(\s*$)/gi,"");
		},
		
		replaceAll: function(val, find, replace) {
			return val.split(find).join(replace);
		},
		
		getTodayFormat: function(f,v,t) {
		    var weekName = ["일요일", "월요일", "화요일", "수요일", "목요일", "금요일", "토요일"];
		    var d = new Date();
		    if (t != undefined){
		    	if (t == "Y")
		    		d.setFullYear(d.getFullYear() + v);
		    	if (t == "M")
		    		d.setMonth(d.getMonth() + v);
		    	if (t == "D")
		    		d.setDate(d.getDate() + v);
		    }
		    
		    return f.replace(/(yyyy|yy|MM|dd|E|hh|mm|ss|a\/p)/gi, function($1) {
		        switch ($1) {
		            case "yyyy": return d.getFullYear();
		            case "yy": return (d.getFullYear() % 1000).zf(2);
		            case "MM": return (d.getMonth() + 1).zf(2);
		            case "dd": return d.getDate().zf(2);
		            case "E": return weekName[d.getDay()];
		            case "HH": return d.getHours().zf(2);
		            case "hh": return ((h = d.getHours() % 12) ? h : 12).zf(2);
		            case "mm": return d.getMinutes().zf(2);
		            case "ss": return d.getSeconds().zf(2);
		            case "a/p": return d.getHours() < 12 ? "오전" : "오후";
		            default: return $1;
		        }
		    });
		},
		
		getStrDateComma: function(f){
			if (f && f.length){
				return f.substr(0,4) + "." + f.substr(4,2) + "." + f.substr(6,2);
			} else {
				return "";
			}
		},
		
		getStrTimeColon: function(t){
			if (t && t.length){
				return t.substr(0,2) + ":" + t.substr(2,2);
			} else {
				return t;
			}
		},
		
		getTelCenterLine: function(val){
			if (val && val.length) {
				if (val.length == 11)
					return val.substr(0,3) + "-" + val.substr(3,4) + "-" + val.substr(7,4);
				else
					return val.substr(0,3) + "-" + val.substr(3,3) + "-" + val.substr(6,4);
			} else {
				return "";
			}
		},
		
		setTelClickCall: function(val){
			return "<span style=\"text-decoration:underline;\" onclick=\"M.sys.call('" + val + "')\">" + window.Utils.getTelCenterLine(val) + "</span>";
		},
		
		getCalendar: function(target, prev_inputID, next_inputID) {
			var inputID = target != null ? target : $(this).data("target");
			if (inputID != "" && inputID != undefined){
				var objInput = $("#" + inputID);
				var objPrev = $("#" + prev_inputID);
				var objNext = $("#" + next_inputID);
				popupManager.date({
				    initDate  : objInput.val() == "" ? moment().format("YYYYMMDD") : objInput.val().split(".").join(""),
				    startDate : prev_inputID == null ? "19000101" : objPrev.val().split(".").join(""),
				    endDate   : next_inputID == null ? "29991231" : objNext.val().split(".").join("")}, 
				    function(result, setting) {
				    	if (result.status == "SUCCESS") {
				    		objInput.val(result.yyyy + "." + result.MM + "." + result.dd);
				    	}
				    }
				);
			}
		},
		
		setNumberOnly: function(objID){
			$("#" + objID).on("keydown", function(event){
				var keyID = (event.which) ? event.which : event.keyCode;
				if( ( keyID >=48 && keyID <= 57 ) || ( keyID >=96 && keyID <= 105 ) || keyID == 8 || keyID == 46 || keyID == 37 || keyID == 39 )
				{
					return;
				}
				else
				{
					return false;
				}

			}).css("ime-mode","disabled");
		},
		
		maxLengthCheck: function(obj){
			if (obj.value.length > obj.maxLength){
				obj.value = obj.value.slice(0, obj.maxLength);
			}
		}
	}

})(window, document, jQuery, M);

(function(U) {
	window.Utils = U;
})(Utils);

String.prototype.string = function(len){var s = '', i = 0; while (i++ < len) { s += this; } return s;};
String.prototype.zf = function(len){return "0".string(len - this.length) + this;};
Number.prototype.zf = function(len){return this.toString().zf(len);};