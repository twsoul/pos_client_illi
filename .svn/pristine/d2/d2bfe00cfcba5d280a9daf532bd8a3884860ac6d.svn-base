function InputChgQtyPopup(opts){
	var templatePop = "<section class=\"popup_area blind\" id=\"{{ID}}\">"
						+"<div class=\"container\">"
							+"<div class=\"pop_cont\">"
							    +"<p class=\"pop_cont_head\"><span>{{TITLE}}</span></p>"
								+"<div class=\"box_inner\">"
								    +"<div class=\"opt_input\">"
                                        +"<p class=\"lineHead\">{{LABEL}}</p>"
                                        +"<p id=\"SCAN_QTY\" class=\"inputBox_outline\" style=\"color:#fff; padding-left:3%;\">{{VALUE}}</p>"
                                    +"</div>"
								    +"<div class=\"opt_input\">"
								        +"<p class=\"lineHead\">{{LABEL2}}</p>"
								        +"<p class=\"inputBox_outline\" style=\"background-color:#fff; border:1px solid #666;\"><input type=\"{{TYPE}}\"  min=\"0\" onkeyup=\"page.inputEvent(this);\" autocapitalize=\"characters\" onkeydown=\"if(event.keyCode == 13) this.blur();\" onkeypress=\"if(event.key==='.'){event.preventDefault();}\"></p>"
								    +"</div>"
								+"</div>"
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
	var label = opts.label == undefined ? "" : opts.label;
	var label2 = opts.label2 == undefined ? "" : opts.label2;
	var type = opts.type == undefined ? "Text" : opts.type;
	var value = opts.value == undefined ? "Text" : opts.value;
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
						.replace(/\{\{\ID\}\}/, id)
						.replace(/\{\{\LABEL\}\}/, label)
						.replace(/\{\{\LABEL2\}\}/, label2)
						.replace(/\{\{\VALUE\}\}/, value)
						.replace(/\{\{\TYPE\}\}/, type);
		$("body").append(templatePop);

		$("#" + id).on("click", ".btn_area .btn_confirm", function(){
            var val = $("#" + id + " .pop_cont input").val();
			selectDataCode = val;
			okCallback(val);
			thisObj.hide();
		});

		$("#" + id).on("click", ".btn_area .btn_cancel", function(){
		    okCallback("cancel");
			thisObj.hide();
		});
	};

	this.show = function() {
	    $("#" + id + " .pop_cont input").val("");
		$("#" + id).removeClass("blind");
		$("main").addClass("popActive");
	};

	this.hide = function() {
		$("#" + id).addClass("blind");
		$("#" + id).remove();
		$("main").removeClass("popActive");

		if (goBottom)
			$(window).scrollTop($(window).height());
	};

	this.clear = function() {
		$("#" + id).remove();
	};
}