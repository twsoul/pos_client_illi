/*******************************************************************
*	메인 페이지 로직
*******************************************************************/

var page = (function(window, document, $, M, undefined) {
    var getCORP_CD = userManager.getCORP_CD();
    var getUSER_NM = userManager.getUSER_NM();
    var getUSER_ID = userManager.getUSER_ID();
    var getWERKS = optionManager.getWERKS();
    var getLNG = optionManager.getLNG();
    var saveUserCo = dataManager.storage('saveUserCo');

    var C1_LIST = [];
    var BoxArray = [];

    var saveflag = false;

	// 화면 초기화
	var setInitScreen = function() {
	    if (getUSER_NM == "" || getUSER_NM == "undefined" || getUSER_NM == undefined) {
            screenManager.moveToPage('../common/login.html', { action: 'CLEAR_TOP' });
        }
        PlantReq();
	};

	// 이벤트 초기화
	var setInitEvent = function() {
        $("#inputScan").on('keypress', function (e) {
            if (e.key === 'Enter' || e.keyCode === 13) {
                var inputScan = $(this).val();
                $(this).val("");
                $(this).blur();
                if(inputScan != ""){
                    ScanValidation(inputScan);
                }else{
                    $("#inputScan").focus();
                }
            }
        });

        // 플랜트 변경 시 저장위치 콤보박스 신규 호출
        $("#selPLANT").on('change', function() {
            clear();
            DKindReq();
        })

        // 저장 버튼 클릭 시
        $("#btnSave").on('click', function() {
            setSaveClickEvent();
        })

        // 초기화 버튼 클릭 시
        $("#btnInit").on('click', function() {
            clear();
            DKindReq();
        })
	};

    // 플랜트 콤보박스 정보 조회
    var PlantReq = function() {
        networkManager.httpSend({
            server: saveUserCo,
            path: 'api/PlantCodeList.do',
            data: {
                'LANG': getLNG,
                'WERKS': getCORP_CD
            },
            success: function(receivedData, setting) {
                $("#selPLANT").html("");
                if(receivedData.ListCount == 0){
                    popupManager.instance($("[data-lng='MSG.0000000010']").text(), {showtime:"LONG"}); // 플랜트 조회 데이터가 없습니다
                }else{
                    var tag = "";
                    $.each(receivedData.ListData, function(index,rowData){
                        tag += "<option value='" + rowData.VALUE + "'>" + rowData.TEXT + "</option>";
                    });
                    $("#selPLANT").append(tag);
                    $("#selPLANT").val(getWERKS).prop("selected", true);

                    DKindReq();
                }
            }
        });
    };

    var DKindReq = function() {
        networkManager.httpSend({
            server: saveUserCo,
            path: 'api/OT_041_S1.do',
            data: {
                'COPORATE_CD':getCORP_CD,
                'PLANT_CD':$("#selPLANT").val(),
                'event':'이종 확인 불출 정보 조회'
            },
            success: function(receivedData, setting) {
                var rowData = receivedData.ListData[0];

                if(receivedData.ListCount == 0){
                    popupManager.instance($("[data-lng='MSG.0000000652']").text(), {showtime:"LONG"}); // 조회정보가 없습니다
                    $("#inputScan").focus();
                    return;
                }
                $("#list_ot_041_head").removeClass("blind");

                var test = 0;
                var template = $("#ListTemplate").html();
                $.each(receivedData.ListData, function(index,rowData){
                    var tag = "";
                    var exist = false;
                    BoxArray.push({PART : rowData.PART_CD, BOX : rowData.BOX_BAR_NO, QTY : rowData.BAR_QTY, ScanChk : "N" });

                    $("#list_ot_041 .tableCont").each(function() {
                        if($(this).find(".PART_CD").text() == rowData.PART_CD){
                            $(this).find(".INSP_QTY").text(parseInt($(this).find(".INSP_QTY").text()) + parseInt(rowData.BAR_QTY));
                            exist = true;
                        }
                   });
                   if(!exist){
                       tag += template.replace(/\{\{PART_CD\}\}/, rowData.PART_CD)
                                      .replace(/\{\{INSP_QTY\}\}/, rowData.BAR_QTY)
                                      .replace(/\{\{SCAN_QTY\}\}/, 0);
                       $("#list_ot_041").append(tag);
                   }
                });
            }
        });
    };

    // 스캔시 처리 함수
    var ScanValidation = function(inputScan) {
        inputScan = upperManager.Upper(inputScan);
        var userPlantCheck = $("#selPLANT").val();
        if(userPlantCheck == null){
            popupManager.instance($("[data-lng='MSG.0000000118']").text(), {showtime:"LONG"}); // 플랜트를 먼저 선택하십시오
            return;
        }
        if(inputScan.length > 0) {
            if(head_tail_chk(inputScan)){
                BoxNoScan(inputScan);
            }else{
                if(inputScan.indexOf("*") != -1){
                    inputScan = inputScan.split("*")[1];
                }
                if($("#list_ot_041 .tableCont").length == 0){
                    popupManager.instance($("[data-lng='MSG.0000000250']").text(), {showtime:"LONG"}); // 스캔할 리스트가 없습니다
                    $("#inputScan").focus();
                    return;
                }
                if(!IsNotExitList(inputScan)){ // 리스트에 해당 품번이 존재하지 않을경우
                    popupManager.instance($("[data-lng='MSG.0000000251']").text(), {showtime:"LONG"}); // 이종품불출내역에 존재하지 않는 PART NO입니다
                    $("#inputScan").focus();
                    return;
                } else{
                    $("#txtRACK").text(inputScan);
                    $("#inputScan").focus();
                }
            }
        }
    }

    var head_tail_chk = function(inputScan){
        var head,tail;
        head = inputScan.substr(0,4);
        tail = inputScan.substr(inputScan.length-4,4);
        if ( (head=="[)>*") && (tail=="*EOT") )
            return true;
        else
            return false;
    }

    // Box 조회 함수
    var BoxScan = function(box_bar_no){
        var find_chk = false;
        BoxArray.find(object =>{
            if(object.BOX === box_bar_no){
                if(object.ScanChk == "Y"){
                    popupManager.instance($("[data-lng='MSG.0000000269']").text(), {showtime:"LONG"}); // 이미 스캔한 부품식별표입니다
                    find_chk = true;
                    $("#inputScan").focus();
                    return false;
                }else{
                    find_chk = true;
                    object.ScanChk = "Y";

                    $("#list_ot_041 .tableCont").each(function() {
                        if($(this).find(".PART_CD").text() == object.PART){
                            $(this).find(".SCAN_QTY").text(parseInt($(this).find(".SCAN_QTY").text()) + parseInt(object.QTY));
                            $("#inpBoxQty").text(parseInt($("#inpBoxQty").text())+1);
                            $(this).prependTo('div .list_ot_041:eq(1)');
                            C1_LIST.push({"COPORATE_CD":getCORP_CD, "PLANT_CD":$("#selPLANT").val(), "BOX_BAR_NO":box_bar_no, "USER_ID":getUSER_ID, "USER_NM":getUSER_NM, "RTN_MSG":""});
                        }
                   });
                }
            }
        });

        if(!find_chk){
            popupManager.instance($("[data-lng='MSG.0000000682']").text(), {showtime:"LONG"}); // 문서에 해당 BOX NO가 존재 하지 않습니다
            $("#inputScan").focus();
            return;
        }
    }

    // 저장 조건 처리 로직
    var setSaveClickEvent = function(){
        if(saveflag){ return; }
        if($("#inpBoxQty").text() == "0"){
            popupManager.instance($("[data-lng='MSG.0000000137']").text(), {showtime:"LONG"}); // 스캔하신 내역이 없습니다
            $("#inputScan").focus();
            return;
        }
        if($("#txtRACK").text() == ""){
            popupManager.instance($("[data-lng='MSG.0000000544']").text(), {showtime:"LONG"}); // RACK바코드 먼저 스캔하십시오
            $("#inputScan").focus();
            return;
        }

        save();
    }

    var save = function() {
        saveflag = true;
        networkManager.httpSend({
            server: saveUserCo,
            path: 'api/PR_PDA_OT_041_C1.do',
            data: {
                'param1': C1_LIST
            },
            success: function(receivedData, setting) {
                if(receivedData.result=="S"){
                    popupManager.instance($("[data-lng='MSG.0000000272']").text(), {showtime:"LONG"}); // 저장이 완료되었습니다
                    clear();
                    DKindReq();
                }else{
                    popupManager.instance($("[data-lng='MSG.0000000373']").text(), {showtime:"LONG"}); // 저장에 실패하였습니다
                    saveflag = false;
                }
            },
            error: function(errorCode, errorMessage, settings) {
                popupManager.instance($("[data-lng='MSG.0000000373']").text(), {showtime:"LONG"}); // 저장에 실패하였습니다
                saveflag = false;
            }
        });
    }

    // 화면 초기화
    var clear = function() {
        $("#list_ot_041").html("");
        $("#txtRACK").text("");
        $("#list_ot_041_head").addClass("blind");
        $("#inpBoxQty").text("0");
        C1_LIST.length = 0;
        BoxArray.length = 0;
        saveflag = false;
        $("#inputScan").focus();
    }

    // BOX_No이 리스트에 존재하는지 확인하는 함수
     var IsNotExitList = function(part_cd){
         var rtn = false;

         $("#list_ot_041 .tableCont").each(function() {
             if($(this).find(".PART_CD").text() == part_cd){
                 rtn = true;
                 return false; // each문의 break;
             }
         });

         return rtn;
     };

	var moveToBack = function() {
		screenManager.moveToBack();
	};

	// Public Method
	return {
		setInitScreen: setInitScreen,
		setInitEvent: setInitEvent,
		moveToBack: moveToBack
	};
})(window, document, $, M);

/*******************************************************************
*	MCore Common Events
*******************************************************************/
M.onReady(function(e) {
	page.setInitScreen();
	page.setInitEvent();
}).onHide(function(e){
	// 화면 이동 전에 호출
}).onRestore(function(e) {
	// 해당화면으로 다시 돌아왔을때 호출
}).onBack(function() {
	// 안드로이드 뒤로가기 버튼 클릭시 호출
	page.moveToBack();
});