function PWchangePopup(opts){
	var templatePop = "<section class=\"popup_area blind\" id=\"{{ID}}\">"
						+"<div class=\"container\">"
							+"<div class=\"pop_cont\">"
							    +"<p class=\"pop_cont_head\"><span>{{TITLE}}</span></p>"
								+"<div class=\"box_inner\">"
								    +"<div class=\"opt_input\">"
                                        +"<p class=\"lineHead\" style=\"width:40%;\">ID</p>"
                                        +"<p id=\"id\" class=\"inputBox_outline\" style=\"color:#fff; padding-left:3%; width:60%;\">{{VALUE}}</p>"
                                    +"</div>"
								    +"<div class=\"opt_input\">"
								        +"<p class=\"lineHead\" style=\"width:40%;\">{{LABEL1}}</p>"
								        +"<p class=\"inputBox_outline\" style=\"background-color:#fff; border:1px solid #666; width:60%;\"><input id=\"password\" type=\"password\" onkeydown=\"if(event.keyCode == 13) this.blur();\"></p>"
								    +"</div>"
                                    +"<div class=\"opt_input\">"
                                        +"<p class=\"lineHead\" style=\"width:40%;\">{{LABEL2}}</p>"
                                        +"<p class=\"inputBox_outline\" style=\"background-color:#fff; border:1px solid #666; width:60%;\"><input id=\"password2\" type=\"password\" onkeydown=\"if(event.keyCode == 13) this.blur();\"></p>"
                                    +"</div>"
								+"</div>"
								+"<div class=\"btn_area\">"
									+"<p class=\"classicalBtn adjColor\"><button type=\"submit\" class=\"btn_confirm\">{{CONFIRM}}</button></p>"
									+"<p class=\"classicalBtn\"><button type=\"button\" class=\"btn_cancel\">{{CANCEL}}</button></p>"
								+"</div>"
							+"</div>"
						+"</div>"
					+"</section>"
	var today = new Date();
	var id = opts.id == undefined ? "selPop" + today.getMilliseconds() : opts.id;
	var title = opts.title;
	var label1 = opts.label1;
	var label2 = opts.label2;
	var confirm = opts.confirm;
	var cancel = opts.cancel;
	var msg1 = opts.msg1;
	var msg2 = opts.msg2;
	var msg3 = opts.msg3;
	var value = opts.value == undefined ? "" : opts.value;
	var pw = opts.pw == undefined ? "" : opts.pw;
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
		templatePop = templatePop.replace(/\{\{\ID\}\}/, id)
		                         .replace(/\{\{\TITLE\}\}/, title)
		                         .replace(/\{\{\LABEL1\}\}/, label1)
		                         .replace(/\{\{\LABEL2\}\}/, label2)
		                         .replace(/\{\{\CONFIRM\}\}/, confirm)
                                 .replace(/\{\{\CANCEL\}\}/, cancel)
		                         .replace(/\{\{\VALUE\}\}/, value);
		$("body").append(templatePop);

		$("#" + id).on("click", ".btn_area .btn_confirm", function(){
		    var code = $("#id").text();
		    var val = $("#password").val();
		    var val2 = $("#password2").val();
		    if(code == "" || val == "" || val2 == ""){
		        popupManager.instance(msg3, {showtime:"LONG"});
		        return;
		    }
		    if(val == val2){
		        if(pw == val){
                    popupManager.instance(msg2, {showtime:"LONG"});
                    return;
                }
		        selectDataCode = val;
		        okCallback(code,val);
		        thisObj.hide();
		    }else{
		        popupManager.instance(msg1, {showtime:"LONG"});
		    }
		});
		$("#" + id).on("click", ".btn_area .btn_cancel", function(){
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