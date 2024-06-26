/**
 * Select List Pop-up
 * 0104240
 * 2017-08-07
 * 
 */
function SelectListPopup(opts){
	var templatePop = "<section class=\"popup_area layerPop blind\" id=\"{{ID}}\">"
						+ "<div class=\"container\">"
							+ "<div class=\"pop_cont\">"
								+"<p class=\"pop_cont_head\"><span>{{TITLE}}</span></p>"
								+"<ul class=\"rolling_area\">"
								+"</ul>"
								+"<div class=\"btn_area\">"
									+"<p class=\"classicalBtn adjColor\"><button type=\"submit\" class=\"btn_confirm\">확인</button></p>"
									+"<p class=\"classicalBtn\"><button type=\"button\" class=\"btn_cancel\">취소</button></p>"
								+"</div>"
							+"</div>"
						+"</div>"
					+"</section>"
	var title = opts.title;
	var today = new Date();
	var id = opts.id == undefined ? "selPop" + today.getMilliseconds() : opts.id;
	var objBtn = opts.btnObj;
	var thisObj = this;
	var okCallback = opts.submitCallback;
	var selectDataCode = "";
	var goBottom = opts.goBottom == undefined ? false : opts.goBottom;
	
	this.setSelectCode = function(selCode) {
		selectDataCode = selCode;
	};
	
	this.init = function() {
		selectDataCode = "";
		if (objBtn != undefined)
			objBtn.on("click", thisObj.show);
		templatePop = templatePop.replace(/\{\{\TITLE\}\}/, title)
						.replace(/\{\{\ID\}\}/, id);
		$("body").append(templatePop);
		
		$("#" + id).on("click", ".btn_area .btn_confirm", function(){
			var code = $("#" + id + " .rolling_area li.on").data("value");
			var name = $("#" + id + " .rolling_area li.on span").html();
			var ext1 = $("#" + id + " .rolling_area li.on").data("ext1");
			var ext2 = $("#" + id + " .rolling_area li.on").data("ext2");
			var ext3 = $("#" + id + " .rolling_area li.on").data("ext3");
			selectDataCode = code;
			okCallback(code, name, ext1, ext2, ext3);
			thisObj.hide();
		});
		
		$("#" + id).on("click", ".btn_area .btn_cancel", function(){
			thisObj.hide();
		});
		
		$("#" + id).on("click", ".rolling_area li", function() {
			$(this).addClass("on")
			$(this).siblings("li").removeClass("on");
		});
	};
	
	this.setDB = function(data, code, name, EXT1, EXT2, EXT3) {
		var tag = "";
		$("#" + id + " .rolling_area").html("");
		$.each(data, function(index,rowData){
			tag += "<li data-value='" + eval("rowData." + code) + "'"; 
			if (EXT1 != undefined){
				tag += " data-ext1='" + eval("rowData." + EXT1) + "'";
			}
			if (EXT2 != undefined){
				tag += " data-ext2='" + eval("rowData." + EXT2) + "'";
			}
			if (EXT3 != undefined){
				tag += " data-ext3='" + eval("rowData." + EXT3) + "'";
			}
			tag += "><span>" + eval("rowData." + name) + "</span></li>";
		});
		$("#" + id + " .rolling_area").append(tag);
	};
	
	this.show = function() {
		var objThis;
		if (selectDataCode != ""){
			$("#" + id + " .rolling_area li").each(function(index){
				if ($(this).data("value") == selectDataCode){
					$(this).addClass("on");
					objThis = this;
				} else {
					$(this).removeClass("on");
				}
			});
		} else {
			$("#" + id + " .rolling_area li:eq(0)").addClass("on");
		}
		$("#" + id).removeClass("blind");
		$("main").addClass("popActive");
		
		if (objThis != undefined)
			objThis.scrollIntoView(true);
	};
	
	this.hide = function() {
		$("#" + id).addClass("blind");
		$("main").removeClass("popActive");

		if (goBottom)
			$(window).scrollTop($(window).height());
	};
	
	this.clear = function() {
		$("#" + id).remove();
	};
}