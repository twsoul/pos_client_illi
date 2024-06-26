/*******************************************************************
*	페이지 로직
*******************************************************************/

var page = (function(window, document, $, M, undefined) {
    var getCORP_CD = userManager.getCORP_CD();
    var getUSER_NM = userManager.getUSER_NM();
    var getUSER_ID = userManager.getUSER_ID();
    var getWERKS = optionManager.getWERKS();
    var getLGORT20 = optionManager.getLGORT20();
    var getLNG = optionManager.getLNG();
    var saveUserCo = dataManager.storage('saveUserCo');

    var bl_no = "";
    var cont_no = "";

    var saveflag = false;

	// 화면 초기화
	var setInitScreen = function() {
	    if (getUSER_NM == "" || getUSER_NM == "undefined" || getUSER_NM == undefined) {
            screenManager.moveToPage('../common/login.html', { action: 'CLEAR_TOP' });
        }
        // 화면 초기화시 공장, 사외창고 콤보박스 조회
        PlantReq();
        LogiReq();
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
            $("#inputScan").focus();
        })

        // 사외창고 변경 시 스캔으로 포커스
        $("#selLOGI").on('change', function() {
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
                }
            }
        });
    };

    // 플랜트 콤보박스 정보 조회
    var LogiReq = function() {
        networkManager.httpSend({
            server: saveUserCo,
            path: 'api/selectOtLogi.do',
            data: {
                'LANG': getLNG,
                'COPORATE_CD': getCORP_CD
            },
            success: function(receivedData, setting) {
                $("#selLOGI").html("");
                if(receivedData.ListCount == 0){
                    popupManager.instance($("[data-lng='MSG.0000000632']").text(), {showtime:"LONG"}); // 사외창고 조회정보가 없습니다
                }else{
                    var tag = "";
                    $.each(receivedData.ListData, function(index,rowData){
                        tag += "<option value='" + rowData.COM_CD + "'>" + rowData.COM_NM + "</option>";
                    });
                    $("#selLOGI").append(tag);
                }
            }
        });
    };

    // 스캔시 처리 함수
    var ScanValidation = function(inputScan) {
        if($("#selPLANT").val() == null){
            popupManager.instance($("[data-lng='MSG.0000000118']").text(), {showtime:"LONG"}); // 플랜트를 먼저 선택하십시오
            $("#inputScan").focus();
            return;
        }
        if($("#selLOGI").val() == null){
            popupManager.instance($("[data-lng='MSG.0000000633']").text(), {showtime:"LONG"}); // 사외창고를 먼저 선택하십시오
            $("#inputScan").focus();
            return;
        }
        if(inputScan.length > 0) {
            BarCodeScan(inputScan);
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

    // 바코드 BoxNo 추출 함수
    var BoxNoProcessing = function(barcode){
        var myResult = /:3S.{2,}/g.exec(barcode);
        if (myResult!=null){
            var box_no = myResult[0].substr(3,myResult[0].length-1);
            console.log(box_no.substr(0,box_no.indexOf(":")));
            return box_no.substr(0,box_no.indexOf(":"));
        }else{
            barcode_chk = false;
            return "";
        }
    }

    // 스캔 시 케이스 조회
    var BarCodeScan = function(barcode) {
        var p_barcode = "";
        var case_flag = true;

        if(head_tail_chk(barcode)){
            p_barcode = BoxNoProcessing(barcode);
            case_flag = false;
        }else{
            p_barcode = barcode;
        }
        if(p_barcode == "" || p_barcode < 6){
            popupManager.instance($("[data-lng='MSG.0000000479']").text(), {showtime:"LONG"}); // 잘못된 바코드 형식입니다
            $("#inputScan").focus();
            return;
        }

        networkManager.httpSend({
            server: saveUserCo,
            path: 'api/KD_145_S1.do',
            data: {
                'COPORATE_CD':getCORP_CD,
                'PLANT_CD':$("#selPLANT").val(),
                'LOGI_CD':$("#selLOGI").val(),
                'BAR_NO':p_barcode,
                'event':'STOCK_MA 조회'
            },
            success: function(receivedData, setting) {
                var rowData = receivedData.ListData[0];
                var bar_qty = "";

                if (IsNotExitList(p_barcode)) {
                    popupManager.instance($("[data-lng='MSG.0000000754']").text(), {showtime:"LONG"}); // 이미 리스트에 존재하는 BARCODE NO 입니다
                    $("#inputScan").focus();
                    return;
                }

                // 스캔시 플랜트와 사외창고 선택 불가
                $("#selPLANT").attr("disabled",true);
                $("#selLOGI").attr("disabled",true);

                var tag = "";
                var template = $("#ListTemplate").html();

                if(receivedData.ListCount == 0){
                    if(case_flag){
                        tag += template.replace(/\{\{BAR_CODE\}\}/, p_barcode)
                                       .replace(/\{\{NO\}\}/, p_barcode.substr(p_barcode.length-6,6))
                                       .replace(/\{\{BAR_QTY\}\}/, 0)
                                       .replace(/\{\{REAL_QTY\}\}/, 0)
                                       .replace(/\{\{VENDOR_CD\}\}/, "")
                                       .replace(/\{\{PART_CD\}\}/, "")
                                       .replace(/\{\{IN_DT\}\}/, "")
                                       .replace(/\{\{LB0000000753\}\}/, $("[data-lng='LB.0000000753']").text())   // 바코드
                                       .replace(/\{\{LB0000000664\}\}/, $("[data-lng='LB.0000000664']").text())   // NO
                                       .replace(/\{\{LB0000000019\}\}/, $("[data-lng='LB.0000000019']").text())   // 수량
                                       .replace(/\{\{LB0000000311\}\}/, $("[data-lng='LB.0000000311']").text());  // 실사수량

                        $("#inpBoxQty").text(parseInt($("#inpBoxQty").text())+1);
                        $("#list_kd_145").prepend(tag);
                    }else{
                        popupManager.instance($("[data-lng='MSG.0000000755']").text(), {showtime:"LONG"}); // 존재하지 않는 바코드 입니다
                        $("#inputScan").focus();
                        return;
                    }

                    return;
                }

                tag += template.replace(/\{\{BAR_CODE\}\}/, p_barcode)
                               .replace(/\{\{NO\}\}/gi, rowData.CASE_NO)
                               .replace(/\{\{BAR_QTY\}\}/, rowData.GOOD_QTY)
                               .replace(/\{\{REAL_QTY\}\}/, rowData.GOOD_QTY)
                               .replace(/\{\{VENDOR_CD\}\}/, rowData.VENDOR_CD)
                               .replace(/\{\{PART_CD\}\}/, rowData.PART_CD)
                               .replace(/\{\{IN_DT\}\}/, rowData.IN_DT)
                               .replace(/\{\{LB0000000753\}\}/, $("[data-lng='LB.0000000753']").text())   // 바코드
                               .replace(/\{\{LB0000000664\}\}/, $("[data-lng='LB.0000000664']").text())   // NO
                               .replace(/\{\{LB0000000019\}\}/, $("[data-lng='LB.0000000019']").text())   // 수량
                               .replace(/\{\{LB0000000311\}\}/, $("[data-lng='LB.0000000311']").text());  // 실사수량

                if(case_flag){
                    // 스캔마다 CASE 개수 증가
                    $("#inpBoxQty").text(parseInt($("#inpBoxQty").text())+1);
                } else {
                    // 스캔마다 BOX 개수 증가
                    $("#inpBoxQty2").text(parseInt($("#inpBoxQty2").text())+1);
                }

                $("#list_kd_145").prepend(tag);

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

        $("#list_kd_145 .tableCont").each(function() {
            C1_LIST.push({"COPORATE_CD":getCORP_CD, "PLANT_CD":$("#selPLANT").val(), "LOGI_CD":$("#selLOGI").val(), "CASE_NO":$(this).find(".NO").text(), "BAR_NO":$(this).find(".BAR_CODE").text(), "PART_CD":$(this).data("partcd"), "VENDOR_CD":$(this).data("vendorcd"), "ORG_QTY":$(this).find(".BAR_QTY").text(), "SCAN_QTY":$(this).find(".REAL_QTY").val(), "IN_DT":$(this).data("indt"), "USER_ID":getUSER_ID, "RTN_MSG":""});
        });

        $.each(C1_LIST,function(key,value){
            console.log("key : " + key + " / " + "value : " + JSON.stringify(value));
            $.each(value,function(key,value){
                console.log("key : " + key + " / " + "value : " + JSON.stringify(value));
            });
        });

        networkManager.httpSend({
            server: saveUserCo,
            path: 'api/PR_PDA_KD_145_C1.do',
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
        $("#list_kd_145").html("");
        $("#inpBoxQty").text("0");
        $("#inpBoxQty2").text("0");
        $("#selPLANT").attr("disabled",false);
        $("#selLOGI").attr("disabled",false);

        saveflag = false;
        $("#inputScan").focus();
    }

    // Bar_No 리스트에 존재하는지 확인하는 함수
    var IsNotExitList = function(bar_no){
        var rtn = false;

        $("#list_kd_145 .tableCont").each(function() {
            if($(this).find(".BAR_CODE").text() == bar_no){
                rtn = true;
                return false; // each문의 break;
            }
        });

        return rtn;
    };

    var inputEvent = function(obj) {
        if($(obj).val() == ""){
            $(obj).val(0);
        }
    };

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
		setReloadEvent: setReloadEvent,
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
	page.setReloadEvent();
}).onBack(function() {
	// 안드로이드 뒤로가기 버튼 클릭시 호출
	page.moveToBack();
});