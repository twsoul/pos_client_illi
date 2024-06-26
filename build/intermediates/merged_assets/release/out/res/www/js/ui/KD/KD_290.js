/*******************************************************************
*	페이지 로직
*******************************************************************/

var page = (function(window, document, $, M, undefined) {
    var getCORP_CD = userManager.getCORP_CD();
    var getUSER_NM = userManager.getUSER_NM();
    var getUSER_ID = userManager.getUSER_ID();
    var getWERKS = optionManager.getWERKS();
    var getLGORT = optionManager.getLGORT();
    var getLGORT20 = optionManager.getLGORT20();
    var getLNG = optionManager.getLNG();
    var saveUserCo = dataManager.storage('saveUserCo');

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

        // 플랜트 변경 시 스캔으로 포커스
        $("#selPLANT").on('change', function() {
            StorageLocationReq("10");
            StorageLocationReq2("10");
        })

        // 저장창고 변경 시 스캔으로 포커스
        $("#selLOCTP").on('change', function() {
            $("#inputScan").focus();
        })

        // 저장 버튼 클릭 시
        $("#btnSave").on('click', function() {
            setSaveClickEvent();
        })

        // 초기화 버튼 클릭 시
        $("#btnInit").on('click', function() {
            clear();
        })

        // 포커스가 빠지면 바로 다시 넣는다.
        $("#inputScan").blur(function() {
            $("#inputScan").focus();
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
                    popupManager.instance($("[data-lng='MSG.0000000010']").text(), {showtime:"LONG"});
                }else{
                    var tag = "";
                    $.each(receivedData.ListData, function(index,rowData){
                        tag += "<option value='" + rowData.VALUE + "'>" + rowData.TEXT + "</option>";
                    });
                    $("#selPLANT").append(tag);
                    $("#selPLANT").val(getWERKS).prop("selected", true);
                    StorageLocationReq("10");
                    StorageLocationReq2("10");
                }
            }
        });
    };

    // 원창, 현창 정보 조회 함수
    var StorageLocationReq = function(type) {
        networkManager.httpSend({
            server: saveUserCo,
        	path: 'api/LocCodeListLP.do',
        	data: {
            	'PLANT': $("#selPLANT option:selected").val(),
            	'TYPE': [type]
            },
        	success: function(receivedData, setting) {
        	    var tag = "";
                $("#selLOCTP").html("");
                if(receivedData.ListCount != 0){
                     $.each(receivedData.ListData, function(index,rowData){
                        tag += "<option value='" + rowData.LOC_TP + "'>" + rowData.LOC_NM + "</option>";
                     });
                }
                $("#selLOCTP").append(tag);
        	}
        });
    }
    // 원창, 현창 정보 조회 함수
    var StorageLocationReq2 = function(type) {
        networkManager.httpSend({
            server: saveUserCo,
            path: 'api/LocCodeListKD.do',
            data: {
                'PLANT': $("#selPLANT option:selected").val(),
                'TYPE': [type]
            },
            success: function(receivedData, setting) {
                var tag = "";
                $("#selLOCTP2").html("");
                if(receivedData.ListCount != 0){
                     $.each(receivedData.ListData, function(index,rowData){
                        tag += "<option value='" + rowData.LOC_TP + "'>" + rowData.LOC_NM + "</option>";
                     });
                }
                $("#selLOCTP2").append(tag);
                $("#inputScan").focus();
            }
        });
    }

    // 스캔시 처리 함수
    var ScanValidation = function(inputScan) {
        if($("#selPLANT").val() == null){
            popupManager.instance($("[data-lng='MSG.0000000118']").text(), {showtime:"LONG"}); // 플랜트를 먼저 선택하십시오
            $("#inputScan").focus();
            return;
        }
        if($("#selLOCTP").val() == null){
            popupManager.instance($("[data-lng='MSG.0000000117']").text(), {showtime:"LONG"}); // 저장위치를 먼저 선택하십시오
            $("#inputScan").focus();
            return;
        }
        if(inputScan.length > 0) {
            if(inputScan.length < 6){
                popupManager.instance($("[data-lng='MSG.0000000479']").text(), {showtime:"LONG"}); // 잘못된 바코드 형식입니다
                $("#inputScan").focus();
                return;
            }
            if(head_tail_chk(inputScan) == true){
                BoxNoScan(inputScan);
            }else{
                CaseNoScan(inputScan);
            }

        }
    }

    var head_tail_chk = function(barcode){
        var head,tail;
        head = barcode.substr(0,4);
        tail = barcode.substr(barcode.length-4,4);
        if ( (head=="[)>*") && (tail=="*EOT") )
            return true;
        else
            return false;
    }

    // 스캔 시 케이스 조회
    var CaseNoScan = function(caseno) {
        networkManager.httpSend({
            server: saveUserCo,
            path: 'api/KD_280_S1.do',
            data: {
                'COPORATE_CD':getCORP_CD,
                'PLANT_CD':$("#selPLANT").val(),
                'LOC_TP':$("#selLOCTP").val(),
                'CASE_NO':caseno,
                'event':'CASE NO 조회'
            },
            success: function(receivedData, setting) {
                var rowData = receivedData.ListData[0];
                var exists = false;

                // U_LO_CASE_MST_MA 에 데이터 없을 때
                if(receivedData.ListCount == 0){
                    popupManager.instance($("[data-lng='MSG.0000000639']").text(), {showtime:"LONG"}); // 존재하지 않는 CASE NO 입니다
                    $("#inputScan").focus();
                    return;
                }

                // CASE 중복 스캔 방지
                $("#list_kd_290 .tableCont").each(function() {
                    if($(this).find(".NO").text() == caseno){
                        exists = true;
                    }
                });

                if(exists){
                    popupManager.instance($("[data-lng='MSG.0000000745']").text(), {showtime:"LONG"}); // 이미 리스트에 존재하는 CASE NO 입니다
                    $("#inputScan").focus();
                    return;
                }

                // 스캔시 플랜트와 현창 선택 불가
                $("#selPLANT").attr("disabled",true);
                $("#selLOCTP").attr("disabled",true);

                var tag = "";
                var template = $("#ListTemplate").html();
                $("#list_kd_290_head").removeClass("blind");

                $.each(receivedData.ListData, function(index,rowData){
                    tag += template.replace(/\{\{GUBUN\}\}/, "CASE")
                                   .replace(/\{\{NO\}\}/, caseno)
                                   .replace(/\{\{PART_CD\}\}/, rowData.PART_CD)
                                   .replace(/\{\{BAR_QTY\}\}/, rowData.BAR_QTY)
                                   .replace(/\{\{VENDOR_CD\}\}/, rowData.VENDOR_CD);
                });
                $("#list_kd_290").prepend(tag);
                $("#inpBoxQty").text(parseInt($("#inpBoxQty").text())+1);

                $("#inputScan").focus();
            }
        });
    }

    var BoxNoScan = function(box_barcode) {
        networkManager.httpSend({
            server: saveUserCo,
            path: 'api/selectBoxNoOut.do',
            data: {
                'COPORATE_CD': getCORP_CD,
                'PLANT_CD': $("#selPLANT option:selected").val(),
                'LOC_TP': $("#selLOCTP option:selected").val(),
                'BOX_BAR_NO': box_barcode,
                'LANG':getLNG,
                'event':'부품식별표 조회'
            },
            success: function(receivedData, setting) {
                var rowData = receivedData.ListData[0];
                var exists = false;

                if(receivedData.ListCount == 0){
                    popupManager.instance($("[data-lng='MSG.0000000270']").text(), {showtime:"LONG"}); // 부품식별표가 존재하지 않습니다
                    $("#inputScan").focus();
                    return;
                }
                if(rowData.HOLD_FLAG == "Y"){
                    popupManager.instance($("[data-lng='MSG.0000000315']").text(), {showtime:"LONG"}); // 보류상태의 부품식별표입니다
                    $("#inputScan").focus();
                    return;
                }
                if(rowData.PLANT_CD != $("#selPLANT").val()) {
                    popupManager.instance($("[data-lng='MSG.0000000297']").text(), {showtime:"LONG"}); // 타 공장 바코드입니다
                    $("#inputScan").focus();
                    return;
                }
                if(rowData.LOC_TP != $("#selLOCTP").val()) {
                    popupManager.instance($("[data-lng='MSG.0000000302']").text(), {showtime:"LONG"}); // 타 저장위치 바코드입니다
                    $("#inputScan1").focus();
                    return;
                }
                if(rowData.LOC_TP_TYPE != 10) {
                    popupManager.instance(rowData.BOX_NO + $("[data-lng='MSG.0000000277']").text(), {showtime:"LONG"}); // 는 출고된 Box입니다.'||chr(13)||chr(10)||'Box No를 확인 바랍니다
                    $("#inputScan").focus();
                    return;
                }
                if (rowData.BAR_QTY < 1) {
                    popupManager.instance($("[data-lng='MSG.0000000455']").text(), {showtime:"LONG"}); // 사용할 수 없는 부품식별표 입니다
                    $("#inputScan").focus();
                    return;
                }
                if (rowData.TRANS_TYPE == "MAAR") {
                    popupManager.instance($("[data-lng='MSG.0000000453']").text(), {showtime:"LONG"}); // 입하상태의 부품식별표입니다
                    $("#inputScan").focus();
                    return;
                }

                // CASE 중복 스캔 방지
                $("#list_kd_290 .tableCont").each(function() {
                    if($(this).find(".NO").text() == rowData.BOX_NO){
                        exists = true;
                    }
                });

                if(exists){
                    popupManager.instance($("[data-lng='MSG.0000000244']").text(), {showtime:"LONG"}); // 이미 리스트에 존재하는 BOX NO 입니다
                    $("#inputScan").focus();
                    return;
                }

                // 스캔시 플랜트와 현창 선택 불가
                $("#selPLANT").attr("disabled",true);
                $("#selLOCTP").attr("disabled",true);

                var tag = "";
                var template = $("#ListTemplate").html();
                $("#list_kd_290_head").removeClass("blind");

                tag += template.replace(/\{\{GUBUN\}\}/, "BOX")
                               .replace(/\{\{NO\}\}/, rowData.BOX_NO)
                               .replace(/\{\{PART_CD\}\}/, rowData.PART_CD)
                               .replace(/\{\{BAR_QTY\}\}/, rowData.BAR_QTY)
                               .replace(/\{\{VENDOR_CD\}\}/, rowData.VENDOR_CD);
                $("#list_kd_290").prepend(tag);
                $("#inpBoxQty2").text(parseInt($("#inpBoxQty2").text())+1);

                $("#inputScan").focus();
            }
        });
    }

    // 저장 처리
    var setSaveClickEvent = function() {
        if(saveflag){ return; }
        if($("#inpBoxQty").text() == "0" && $("#inpBoxQty2").text() == "0"){
            popupManager.instance($("[data-lng='MSG.0000000137']").text(), {showtime:"LONG"}); // 스캔하신 내역이 없습니다
            $("#inputScan").focus();
            return;
        }

        save();
    }

    var save = function() {
        saveflag = true;
        var C1_LIST = [];

        $("#list_kd_290 .tableCont").each(function() {
            C1_LIST.push({"GUBUN":$(this).find(".GUBUN").text(), "COPORATE_CD":getCORP_CD, "PLANT_CD":$("#selPLANT").val(), "LOC_TP":$("#selLOCTP").val(), "TO_LOC_TP":$("#selLOCTP2").val(), "NUMBER":$(this).find(".NO").text(), "PART_CD":$(this).find(".PART_CD").text(), "BAR_QTY":$(this).find(".BAR_QTY").text(), "VENDOR_CD":$(this).data("vendorcd"), "USER_ID":getUSER_ID, "USER_NM":getUSER_NM, "RTN_MSG":""});
        });

        $.each(C1_LIST,function(key,value){
            console.log("key : " + key + " / " + "value : " + JSON.stringify(value));
            $.each(value,function(key,value){
                console.log("key : " + key + " / " + "value : " + JSON.stringify(value));
            });
        });

        networkManager.httpSend({
            server: saveUserCo,
            path: 'api/PR_PDA_KD_290_C1.do',
            data: {
                'param1': C1_LIST
            },
            success: function(receivedData, setting) {
                if(receivedData.result=="S"){
                    popupManager.instance($("[data-lng='MSG.0000000272']").text(), {showtime:"LONG"}); // 저장이 완료되었습니다
                    clear();
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
        saveflag = false;
        $("#list_kd_290").html("");
        $("#list_kd_290_head").addClass("blind");
        $("#inpBoxQty").text("0");
        $("#inpBoxQty2").text("0");

        $("#selPLANT").attr("disabled",false);
        $("#selLOCTP").attr("disabled",false);

        $("#inputScan").focus();
    }

	// 자식창에 갔다가 돌아왔을때 리로드용
	var setReloadEvent = function() {
	};

	var moveToBack = function() {
		screenManager.moveToBack();
	};

	// Public Method
	return {
		setInitScreen: setInitScreen,
		setInitEvent: setInitEvent,
		moveToBack: moveToBack,
		setReloadEvent: setReloadEvent
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
	page.setReloadEvent();
}).onBack(function() {
	// 안드로이드 뒤로가기 버튼 클릭시 호출
	page.moveToBack();
});