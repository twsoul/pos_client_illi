/*******************************************************************
*	메인 페이지 로직
*******************************************************************/

var page = (function(window, document, $, M, undefined) {
    var getCORP_CD = userManager.getCORP_CD();
    var getUSER_NM = userManager.getUSER_NM();
    var getUSER_ID = userManager.getUSER_ID();
    var getWERKS = optionManager.getWERKS();
    var getLGORT = optionManager.getLGORT();
    var getLNG = optionManager.getLNG();
    var saveUserCo = dataManager.storage('saveUserCo');

    var Box_No_List = [];                   // 저장 데이터 배열
    var pre_count = 0;                      // 잘못된 수량 입력시 사용할 이전 데이터
    var pre_insp_dttm = "";                 // PRE_INSP_DTTM 변수
    var scanflag = false;                   // 팝업창 넘어갈 경우 기존 스캔 비활성화
    var dkindflag = false;                  // 이종품 체크 플래그
    var model = exWNDeviceInfo();           // 단말기 기종 데이터
    var saveflag = false;

	// 화면 초기화
	var setInitScreen = function() {
	    if (getUSER_NM == "" || getUSER_NM == "undefined" || getUSER_NM == undefined) {
            screenManager.moveToPage('../common/login.html', { action: 'CLEAR_TOP' });
        }

        PlantReq();
        $('#chk_Info').prop('checked', false);
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

        // 플랜트 변경 시 원창, 현창 콤보박스 신규 호출
        $("#selPLANT").on("change", function() {
            StorageLocationReq("10");
            StorageLocationReq2();
        });

        // 원창 변경 시 스캔 포커스
        $("#selLOCTP").on("change", function() {
            $("#inputScan").focus();
        });

        // 현창 변경 시 스캔 포커스
        $("#selLOCTP2").on("change", function() {
            $("#inputScan").focus();
        });

        // 분할불출 체크 박스 변경 시
        $("#chk_Info").on("change", function() {
            if ($("#chk_Info").prop("checked")) { // 체크됨
                $("#list_ot_111_1").parent().addClass("blind");
                $("#list_ot_111_2").parent().removeClass("blind");
                clear();
            } else { // 체크 해제됨
                $("#list_ot_111_1").parent().removeClass("blind");
                $("#list_ot_111_2").parent().addClass("blind");
                clear();
            }
        });

        // 초기화 버튼 클릭시
        $("#btnInit").on("click", function() {
             //scanflag =true;
             //ScanPopup();
            setClearClickEvent();
        });

        // 저장 버튼 클릭 시
        $("#btnSave").on("click", function() {
            //scanflag = false;
            setSaveClickEvent();
        });

    };

    // 플랜트 정보 호출 함수
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
                    	tag += "<option value='" + rowData.VALUE + "' value1='" + rowData.ETC_FLAG +"'>" + rowData.TEXT + "</option>";
                    });
                    $("#selPLANT").append(tag);
                    $("#selPLANT").val(getWERKS).prop("selected", true);
                    StorageLocationReq("10");
                    StorageLocationReq2();
    		    }
    		}
    	});
    };

    // 원창, 현창 정보 조회 함수
    var StorageLocationReq = function(type) {
        networkManager.httpSend({
            server: saveUserCo,
        	path: 'api/LocCodeList.do',
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
                if($("#selPLANT option:selected").val() == getWERKS){
                    $("#selLOCTP").val(getLGORT).prop("selected", true);
                }
        	}
        });
    }

    // 원창, 현창 정보 조회 함수
    var StorageLocationReq2 = function() {
        networkManager.httpSend({
            server: saveUserCo,
        	path: 'api/LocCodeList.do',
        	data: {
            	'PLANT': $("#selPLANT option:selected").val(),
            	'TYPE': ["20","30"]
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

    // 스캔시 처리 로직
    var ScanValidation = function(inputScan) {
        inputScan = upperManager.Upper(inputScan);
        var userPlantCheck = $("#selPLANT").val();
        var userLocTpCheck = $("#selLOCTP").val();
        if(userPlantCheck == null){
            popupManager.instance($("[data-lng='MSG.0000000118']").text(), {showtime:"LONG"}); // 플랜트를 먼저 선택하십시오
            $("#inputScan").focus();
            return;
        }
        if(userLocTpCheck == null){
            popupManager.instance($("[data-lng='MSG.0000000245']").text(), {showtime:"LONG"}); // 원창을 먼저 선택하십시오
            $("#inputScan").focus();
            return;
        }
        if(inputScan.length > 0) {
            if ($("#chk_Info").prop("checked")) { // 체크됨
                if($("#txtBoxNo").text() == ""){ // 분할할 분할 식별표
                    DivBoxNo(inputScan);
                } else { // 하나의 분할 식별표만 가능
                    popupManager.instance($("[data-lng='MSG.0000000248']").text(), {showtime:"LONG"}); // 분할불출은 하나의 분할식별표만 가능합니다
                    $("#inputScan").focus();
                    return;
                }
            } else { // 체크 해제됨
                BoxNoScan(inputScan);
            }
        }
    }

    // 부품식별표 조회 ( 분할 분출 체크 해제 시)
    var BoxNoScan = function(box_barcode) {
        networkManager.httpSend({
            server: saveUserCo,
            path: 'api/selectBoxNo.do',
            data: {
                'BOX_BAR_NO': box_barcode,
                'LANG':getLNG,
                'event':'부품식별표 조회'
            },
            success: function(receivedData, setting) {
                var rowData = receivedData.ListData[0];

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
                if(rowData.LOC_TP_TYPE != 10) {
                    popupManager.instance(rowData.BOX_NO + $("[data-lng='MSG.0000000277']").text(), {showtime:"LONG"}); // 는 출고된 Box입니다.'||chr(13)||chr(10)||'Box No를 확인 바랍니다
                    $("#inputScan").focus();
                    return;
                }
                if(rowData.LOC_TP != $("#selLOCTP").val()) {
                    popupManager.instance($("[data-lng='MSG.0000000302']").text(), {showtime:"LONG"}); // 타 저장위치 바코드입니다
                    $("#inputScan").focus();
                    return;
                }
                if (rowData.TRANS_TYPE == "MAAR") {
                    popupManager.instance($("[data-lng='MSG.0000000453']").text(), {showtime:"LONG"}); // 입하상태의 부품식별표입니다
                    $("#inputScan").focus();
                    return;
                }
                if (rowData.BAR_QTY < 1) {
                    popupManager.instance($("[data-lng='MSG.0000000455']").text(), {showtime:"LONG"}); // 사용할 수 없는 부품식별표 입니다
                    $("#inputScan").focus();
                    return;
                }
                if (IsNotExitList(rowData.BOX_NO)) {
                    popupManager.instance($("[data-lng='MSG.0000000244']").text(), {showtime:"LONG"}); // 이미 리스트에 존재하는 BOX NO 입니다
                    $("#inputScan").focus();
                    return;
                }

                //스캔수량 표시
                $("#inpTotQty").text(parseInt($("#inpTotQty").text())+parseInt(rowData.BAR_QTY));

                var tag = "";
                var template = $("#ListTemplate").html();
                tag += template.replace(/\{\{PART_NO\}\}/, rowData.PART_CD)
                               .replace(/\{\{LOC_TP\}\}/, rowData.LOC_TP)
                               .replace(/\{\{BOX_NO\}\}/gi, rowData.BOX_NO)
                               .replace(/\{\{BAR_QTY\}\}/, rowData.BAR_QTY)
                               .replace(/\{\{COPORATE_CD\}\}/, rowData.COPORATE_CD)
                               .replace(/\{\{PLANT_CD\}\}/, rowData.PLANT_CD)
                               .replace(/\{\{VENDOR_CD\}\}/, rowData.VENDOR_CD)
                               .replace(/\{\{VENDOR_NM\}\}/, rowData.VENDOR_NM)
                               .replace(/\{\{BOX_BAR_NO\}\}/, rowData.BOX_BAR_NO)
                               .replace(/\{\{PRE_INSP_DTTM\}\}/, rowData.PRE_INSP_DTTM)
                               .replace(/\{\{FIFO_CHK\}\}/, rowData.FIFO_CHK)
                               .replace(/\{\{FIFO_FLAG\}\}/, rowData.FIFO_FLAG)
                               .replace(/\{\{INSP_FLAG\}\}/, rowData.INSP_FLAG)
                               .replace(/\{\{LB0000000038\}\}/, $("[data-lng='LB.0000000038']").text())  // 품번
                               .replace(/\{\{LB0000000120\}\}/, $("[data-lng='LB.0000000120']").text())  // 부품식별표
                               .replace(/\{\{LB0000000150\}\}/, $("[data-lng='LB.0000000150']").text());  // 스캔수량

                // 스캔시 플랜트와 원창 선택 불가
                $("#selPLANT").attr("disabled",true);
                $("#selLOCTP").attr("disabled",true);

                // 스캔마다 BOX 개수 증가
                $("#inpBoxQty").text(parseInt($("#inpBoxQty").text())+1);

                // 품번 재고 수량 표시
                $("#txtTOTAL_QTY").text(rowData.TOTAL_QTY);
                $("#txtPART_CD").text(rowData.PART_CD);

                $("#list_ot_111_1").prepend(tag);
                $("#inputScan").focus();
            }
        });
    };

    // 부품식별표 조회 ( 분할 분출 체크 시)
    var DivBoxNo = function(box_barcode){
        networkManager.httpSend({
            server: saveUserCo,
            path: 'api/selectBoxNo.do',
            data: {
                'BOX_BAR_NO': box_barcode,
                'LANG':getLNG,
                'event':'부품식별표 조회'
            },
            success: function(receivedData, setting) {
                var rowData = receivedData.ListData[0];

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
                if(rowData.LOC_TP_TYPE != 10) {
                    popupManager.instance(rowData.BOX_NO + $("[data-lng='MSG.0000000277']").text(), {showtime:"LONG"}); // 는 출고된 Box입니다.'||chr(13)||chr(10)||'Box No를 확인 바랍니다
                    $("#inputScan").focus();
                    return;
                }
                if(rowData.LOC_TP != $("#selLOCTP").val()) {
                    popupManager.instance($("[data-lng='MSG.0000000302']").text(), {showtime:"LONG"}); // 타 저장위치 바코드입니다
                    $("#inputScan").focus();
                    return;
                }
                if (rowData.TRANS_TYPE == "MAAR") {
                    popupManager.instance($("[data-lng='MSG.0000000453']").text(), {showtime:"LONG"}); // 입하상태의 부품식별표입니다
                    $("#inputScan").focus();
                    return;
                }
                if(rowData.BAR_QTY < 1) {
                    popupManager.instance($("[data-lng='MSG.0000000455']").text(), {showtime:"LONG"}); // 사용할 수 없는 부품식별표 입니다
                    $("#inputScan").focus();
                    return;
                }

                //스캔수량 표시
                $("#inpTotQty").text(parseInt($("#inpTotQty").text())+parseInt(rowData.BAR_QTY));

                var tag = "";
                var template = $("#ListTemplate2").html();
                tag += template.replace(/\{\{PART_NO\}\}/, rowData.PART_CD)
                               .replace(/\{\{LOC_TP\}\}/, rowData.LOC_TP)
                               .replace(/\{\{BOX_NO\}\}/gi, rowData.BOX_NO)
                               .replace(/\{\{BAR_QTY\}\}/, rowData.BAR_QTY)
                               .replace(/\{\{COPORATE_CD\}\}/, rowData.COPORATE_CD)
                               .replace(/\{\{PLANT_CD\}\}/, rowData.PLANT_CD)
                               .replace(/\{\{VENDOR_CD\}\}/, rowData.VENDOR_CD)
                               .replace(/\{\{VENDOR_NM\}\}/, rowData.VENDOR_NM)
                               .replace(/\{\{BOX_BAR_NO\}\}/, rowData.BOX_BAR_NO)
                               .replace(/\{\{PRE_QTY\}\}/, rowData.BAR_QTY)
                               .replace(/\{\{PRE_INSP_DTTM\}\}/, rowData.PRE_INSP_DTTM)
                               .replace(/\{\{FIFO_CHK\}\}/, rowData.FIFO_CHK)
                               .replace(/\{\{FIFO_FLAG\}\}/, rowData.FIFO_FLAG)
                               .replace(/\{\{INSP_FLAG\}\}/, rowData.INSP_FLAG)
                               .replace(/\{\{LB0000000038\}\}/, $("[data-lng='LB.0000000038']").text())  // 품번
                               .replace(/\{\{LB0000000120\}\}/, $("[data-lng='LB.0000000120']").text())  // 부품식별표
                               .replace(/\{\{LB0000000150\}\}/, $("[data-lng='LB.0000000150']").text())  // 스캔수량
                               .replace(/\{\{LB0000000170\}\}/, $("[data-lng='LB.0000000170']").text())  // 예상수량
                               .replace(/\{\{LB0000000238\}\}/, $("[data-lng='LB.0000000238']").text()); // 분할불출

                // 스캔시 플랜트와 원창 선택 불가
                $("#selPLANT").attr("disabled",true);
                $("#selLOCTP").attr("disabled",true);

                // 스캔마다 BOX 개수 증가
                $("#inpBoxQty").text(parseInt($("#inpBoxQty").text())+1);

                $("#txtPART_CD").text(rowData.PART_CD);
                $("#txtTOTAL_QTY").text(rowData.TOTAL_QTY);
                $("#list_ot_111_2").prepend(tag);
                $("#txtBoxNo").text(rowData.BOX_NO);
                pre_count = rowData.BAR_QTY;
                // 분할 수량 입력 포커스 이동
                $(".DIV_QTY").click();
            }
        });
    }

    // 저장 시 조건 처리 로직
    var setSaveClickEvent = function(){
        if(saveflag){ return; }
        var userLocTpCheck2 = $("#selLOCTP2").val();
        if($("#inpBoxQty").text() == "0"){
            popupManager.instance($("[data-lng='MSG.0000000137']").text(), {showtime:"LONG"}); // 스캔하신 내역이 없습니다
            $("#inputScan").focus();
            return;
        }
        if(userLocTpCheck2 == null){
            popupManager.instance($("[data-lng='MSG.0000000246']").text(), {showtime:"LONG"}); // 현창을 먼저 선택하십시오
            $("#inputScan").focus();
            return;
        }
        if($(".DIV_QTY").val() == 0){
            popupManager.instance($("[data-lng='MSG.0000000301']").text(), {showtime:"LONG"}); // 분할불출 수량은 1개 이상이여야 합니다
            $(".DIV_QTY").click();
            return;
        }


        // 리스트 정보 Box_No_List 배열에 추가
        if ($("#chk_Info").prop("checked")) {
            $("#list_ot_111_2 .tableCont").each(function() {
                pre_insp_dttm = "";
                if($(this).data("preinspdttm") != null && $(this).data("preinspdttm") != undefined && $(this).data("preinspdttm") != "undefined"){
                    pre_insp_dttm = parseInt($(this).data("preinspdttm"));
                }
                Box_No_List.push({"CHECK_YN":"Y", "COPORATE_CD":$(this).data("coperatecd"), "PLANT_CD":$("#selPLANT").val(), "LOC_TP":$("#selLOCTP").val(), "TO_LOC_TP":$("#selLOCTP2").val(), "BOX_NO":$(this).data("boxno"), "VENDOR_CD":$(this).data("vendcd"), "PART_CD":$(this).find(".PART_NO").text(), "EXP_QTY":$(this).find(".PRE_QTY").text(), "DIV_QTY":$(this).find(".DIV_QTY").val(), "PRE_INSP_DTTM":pre_insp_dttm, "INSP_FLAG":$(this).data("inspflag"), "WORK_NM":getUSER_NM, "WORK_ID":getUSER_ID, "RTN_MSG":""});
            });
        } else {
            $("#list_ot_111_1 .tableCont").each(function() {
                pre_insp_dttm = "";

                if($(this).data("fifochk") == "Y" && $(this).data("fifo") == "Y"){
                    fifo = "Y";
                }
                if($(this).data("preinspdttm") != null && $(this).data("preinspdttm") != undefined && $(this).data("preinspdttm") != "undefined"){
                    pre_insp_dttm = parseInt($(this).data("preinspdttm"));
                }
                Box_No_List.push({"CHECK_YN":"N", "COPORATE_CD":$(this).data("coperatecd"), "PLANT_CD":$("#selPLANT").val(), "LOC_TP":$("#selLOCTP").val(), "TO_LOC_TP":$("#selLOCTP2").val(), "BOX_NO":$(this).data("boxno"), "VENDOR_CD":$(this).data("vendcd"), "PART_CD":$(this).find(".PART_NO").text(), "EXP_QTY":$(this).find(".BAR_QTY").text(), "DIV_QTY":"0", "PRE_INSP_DTTM":pre_insp_dttm, "INSP_FLAG":$(this).data("inspflag"), "WORK_NM":getUSER_NM, "WORK_ID":getUSER_ID, "RTN_MSG":""});
            });
        }

        $.each(Box_No_List,function(key,value){
            console.log("key : " + key + " / " + "value : " + JSON.stringify(value));
            $.each(value,function(key,value){
                console.log("key : " + key + " / " + "value : " + JSON.stringify(value));
            });
        });

        save();
    }

    // PR_PDA_OT_010_C1 호출 및 저장
    var save = function() {
        saveflag = true;
        networkManager.httpSend({
            server: saveUserCo,
            path: 'api/PR_PDA_OT_111_C1.do',
            data: {
                'param1': Box_No_List
            },
            success: function(receivedData, setting) {
                if(receivedData.result=="S"){
                    popupManager.instance($("[data-lng='MSG.0000000272']").text(), {showtime:"LONG"}); // 저장이 완료되었습니다
                    clear();
                }else{
                    popupManager.instance($("[data-lng='MSG.0000000373']").text(), {showtime:"LONG"}); // 저장에 실패하였습니다
                    clear();
                }
            },
            error: function(errorCode, errorMessage, settings) {
                popupManager.instance($("[data-lng='MSG.0000000373']").text(), {showtime:"LONG"}); // 저장에 실패하였습니다
                Box_No_List.length = 0;
                saveflag = false;
            }
        });
    }

    // BOX_No이 리스트에 존재하는지 확인하는 함수
    var IsNotExitList = function(box_no){
        var rtn = false;

        if ($("#chk_Info").prop("checked")) {
            $("#list_ot_111_2 .tableCont").each(function() {
                if($(this).data("boxno") == box_no){
                    rtn = true;
                    return false; // each문의 break;
                }
            });
        } else {
            $("#list_ot_111_1 .tableCont").each(function() {
                if($(this).data("boxno") == box_no){
                    rtn = true;
                    return false; // each문의 break;
                }
            });
        }

        return rtn;
    };

    var setClearClickEvent = function(){
        clear();
    }

    // 화면 초기화
    var clear = function() {
        $("#list_ot_111_1").html("");
        $("#list_ot_111_2").html("");
        $("#txtBoxNo").text("");
        $("#txtDivBoxNo").text("");
        $("#inpBoxQty").text("0");
        $("#inpTotQty").text("0");
        $("#txtPART_CD").text("");
        $("#txtTOTAL_QTY").text("0");
        $("#selPLANT").attr("disabled",false);
        $("#selLOCTP").attr("disabled",false);

        Box_No_List.length = 0;
        pre_insp_dttm = "";
        dkindflag = false;
        saveflag = false;

        $("#inputScan").focus();
    }

    var inputEvent = function(obj) {
        var preQty = Number($(".SCAN_QTY").text())-Number($(".DIV_QTY").val());

        if($(obj).val() == ""){
            $(obj).val(0);
            $(obj).click();
        }

        if(preQty < 0){
            popupManager.instance($("[data-lng='MSG.0000000247']").text(), {showtime:"LONG"}); // 분할불출 수량이 스캔수량보다 많습니다
            $(".DIV_QTY").val("0");
            $(".DIV_QTY").click();
            $(".PRE_QTY").text(pre_count);
        } else if(preQty == 0){
            popupManager.instance($("[data-lng='MSG.0000000283']").text(), {showtime:"LONG"}); // 불출할 수량이 스캔수량과 같을경우 일반불출을 사용해 주십시오
            $(".DIV_QTY").val("0");
            $(".DIV_QTY").click();
            $(".PRE_QTY").text(pre_count);
        } else {
            $(".PRE_QTY").text(preQty);
        }
    };

	var moveToBack = function() {
		screenManager.moveToBack();
	};

	// Public Method
	return {
		setInitScreen: setInitScreen,
		setInitEvent: setInitEvent,
		moveToBack: moveToBack,
		inputEvent: inputEvent
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