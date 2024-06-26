/*******************************************************************
*	페이지 로직
*******************************************************************/

var page = (function(window, document, $, M, undefined) {
    var getCORP_CD = userManager.getCORP_CD();
    var getUSER_NM = userManager.getUSER_NM();
    var getUSER_ID = userManager.getUSER_ID();
    var getWERKS = optionManager.getWERKS();
    var getLNG = optionManager.getLNG();
    var saveUserCo = dataManager.storage('saveUserCo');

    var Box_No_List = [];
    var VENDOR_CD = "";
    var inv_flag = "";
    var saveflag = false;

	// 화면 초기화
	var setInitScreen = function() {
        if (getUSER_NM == "" || getUSER_NM == "undefined" || getUSER_NM == undefined) {
           screenManager.moveToPage('../common/login.html', { action: 'CLEAR_TOP' });
        }

        PlantReq();
        $("#inputScan").focus();
	};

	// 이벤트 초기화
	var setInitEvent = function() {
		$("#inputScan").on('keypress', function (e) {
            if (e.key === 'Enter' || e.keyCode === 13) {
                var inputScan = $(this).val();
                $(this).val("");
                $(this).blur();

                if(inputScan != ""){
                    console.log("스캔됨");
                    ScanValidation(inputScan);
                }else{
                    $("#inputScan").focus();
                }
            }
        });

        // 플랜트 변경 시 저장위치 콤보박스 신규 호출
        $("#selPLANT").on('change', function (e) {
            StorageLocationReq();
            ProcCodeReq();
        })

        // 저장위치 변경 시 스캔 포커스
        $("#selLOCTP").on('change', function (e) {
            InvDumpReq();
        })

        // 공정정 변경 시 스캔 포커스
       $("#selPROC").on('change', function (e) {
            $("#inputScan").focus();
        })

        // 공정 확인 체크 박스 해제 시 공정 콤보박스 재선택
        $("#chk_Info").on('change', function (e) {
            if (!$("#chk_Info").prop("checked")) {
                $("#selPROC").val("").prop("selected", true);
            }
        })

        // 적입수량 확인 체크 박스 해제 시 수량 개수 초기화
        $("#chk_Info2").on('change', function (e) {
            if (!$("#chk_Info2").prop("checked")) {
                $("#BOX_IN_QTY").val(0);
                $("#TOT_QTY").val(parseInt($("#REMAIN_QTY").val()));
            }
        })

        // 저장 버튼 클릭 시
        $("#btnSave").on('click', function (e) {
            setSaveClickEvent();
        })

        // 초기화 버튼 클릭 시
        $("#btnInit").on('click', function (e) {
            setClearClickEvent();
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
                    StorageLocationReq();
                    ProcCodeReq();
                }
            }
        });
    };

    // 저장위치 콤보박스 정보 조회
    var StorageLocationReq = function() {
        networkManager.httpSend({
            server: saveUserCo,
            path: 'api/LocCodeList.do',
            data: {
                'PLANT': $("#selPLANT option:selected").val(),
                'TYPE': ["20","30"]
            },
            success: function(receivedData, setting) {
                var tag = "";
                $("#selLOCTP").html("");
                tag += "<option value=''>"+$("[data-lng='LB.0000000119']").text()+"</option>"; // 선택
                if(receivedData.ListCount != 0){
                     $.each(receivedData.ListData, function(index,rowData){
                        tag += "<option value='" + rowData.LOC_TP + "'>" + rowData.LOC_NM + "</option>";
                     });
                }
                $("#selLOCTP").append(tag);
                InvDumpReq();
            }
        });
        $("#inputScan").focus();
    }

    // 저장위치 콤보박스 정보 조회
    var InvDumpReq = function() {
        networkManager.httpSend({
            server: saveUserCo,
            path: 'api/selectInvDump.do',
            data: {
                'COPORATE_CD': getCORP_CD,
                'PLANT_CD': $("#selPLANT option:selected").val(),
                'LOC_TP': $("#selLOCTP option:selected").val(),
                'event':'부품식별표 조회'
            },
            success: function(receivedData, setting) {
                var rowData = receivedData.ListData[0];
                /*
                inv_flag = rowData.INV_FLAG;
                if(rowData.INV_FLAG =="N"){
                    popupManager.instance($("[data-lng='MSG.0000000503']").text(), {showtime:"LONG"}); // 전체 재고실사 덤프데이터가 존재하지 않습니다
                    $("#inputScan").focus();
                    return;
                }
                */
                inv_flag = "Y"; //현창재고실사는 덤프를 사용하지 않는것으로 변경
            }
        });
        $("#inputScan").focus();
    }

    // 공정 콤보박스 정보 조회
    var ProcCodeReq = function() {
        networkManager.httpSend({
            server: saveUserCo,
            path: 'api/selectComboProcCodeField.do',
            data: {
                'LANG': getLNG,
                'COPORATE_CD': getCORP_CD
            },
            success: function(receivedData, setting) {
                var tag = "";
                $("#selPROC").html("");
                tag += "<option value=''>"+$("[data-lng='LB.0000000119']").text()+"</option>"; // 선택
                if(receivedData.ListCount != 0){
                     $.each(receivedData.ListData, function(index,rowData){
                        tag += "<option value='" + rowData.PROC_CD + "'>" + rowData.PROC_NM + "</option>";
                     });
                }
                $("#selPROC").append(tag);
            }
        });
        $("#inputScan").focus();
    }

    // 스캔 시 처리 로직
    var ScanValidation = function(inputScan) {
        inputScan = upperManager.Upper(inputScan);

        if($("#selPLANT").val() == null){
            popupManager.instance($("[data-lng='MSG.0000000118']").text(), {showtime:"LONG"}); // 플랜트를 먼저 선택하십시오
            return;
        }if($("#selLOCTP").val() == ""){
            popupManager.instance($("[data-lng='MSG.0000000117']").text(), {showtime:"LONG"}); // 저장위치를 먼저 선택하십시오
            return;
        }
        if(inv_flag =="N"){
            popupManager.instance($("[data-lng='MSG.0000000503']").text(), {showtime:"LONG"}); // 전체 재고실사 덤프데이터가 존재하지 않습니다
            $("#inputScan").focus();
            return;
        }
        if(inputScan.length > 0) {
            BoxNoScan(inputScan);
        }
    }

    // 부품식별표 조회 함수
    var BoxNoScan = function(box_barcode) {
        var qrCode = new qrManager.QRcode(box_barcode);

        if(!qrManager.isValidBarcode(qrCode)){
            console.log("fail");
            return;
        }
        qrcode_callback(qrCode);

        $("#txtPART_CD").text(lp_part_no);
        $("#BOX_IN_QTY").val(lp_box_qty);

        // 스캔 시 플랜트, 저장위치 선택 불가
        $("#selPLANT").attr("disabled",true);
        $("#selLOCTP").attr("disabled",true);

        networkManager.httpSend({
            server: saveUserCo,
            path: 'api/ST_050_S1.do',
            data: {
                'VENDOR_CD': lp_box_vendcd,
                'LANG':getLNG,
                'event':'부품식별표 조회'
            },
            success: function(receivedData, setting) {
                var rowData = receivedData.ListData[0];

                $("#txtVENDOR_NM").text(rowData.VENDOR_NM == undefined ? "" : rowData.VENDOR_NM);
            }
        });
    };

    // 저장 조건 처리 로직
    var setSaveClickEvent = function(){
        if(saveflag){ return; }
        if($("#txtPART_CD").text() == ""){
            popupManager.instance($("[data-lng='MSG.0000000137']").text(), {showtime:"LONG"}); // 스캔하신 내역이 없습니다
            $("#inputScan").focus();
            return;
        }
        if($("#selPROC").val() == ""){
            popupManager.instance($("[data-lng='MSG.0000000332']").text(), {showtime:"LONG"}); // 공정을 먼저 선택해 주십시오
            return;
        }
        if(!$("#chk_Info").prop("checked") || !$("#chk_Info2").prop("checked")){
            popupManager.instance($("[data-lng='MSG.0000000331']").text(), {showtime:"LONG"}); // 공정, 적입수량을 확인해 주십시오
            return;
        }
        if($("#BOX_QTY").val() == 0 && $("#REMAIN_QTY").val() == 0){
            popupManager.instance($("[data-lng='MSG.0000000334']").text(), {showtime:"LONG"}); // 박스수량과 잔량 둘 다 0인값은 입력 할 수 없습니다
            return;
        }
        if($("#PROC_FROM").val() == ""){
            popupManager.instance($("[data-lng='MSG.0000000332']").text(), {showtime:"LONG"}); // 공정을 먼저 선택해 주십시오
            return;
        }
        if($("#PROC_TO").val() == ""){
            popupManager.instance($("[data-lng='MSG.0000000332']").text(), {showtime:"LONG"}); // 공정을 먼저 선택해 주십시오
            return;
        }

        Box_No_List.push({"COPORATE_CD":getCORP_CD,"PLANT_CD":$("#selPLANT").val(), "LOC_TP":$("#selLOCTP").val(), "VENDOR_CD":lp_box_vendcd, "PART_CD":$("#txtPART_CD").text(), "BOX_IN_QTY":$("#BOX_IN_QTY").val(), "BOX_QTY":$("#BOX_QTY").val(), "REMAIN_QTY":$("#REMAIN_QTY").val(), "PROC_CD":$("#selPROC").val(), "PROC_NO_FROM":$("#PROC_FROM").val(), "PROC_NO_TO":$("#PROC_TO").val(), "USER_ID":getUSER_ID, "USER_NM":getUSER_NM, "RTN_MSG":"" })

        $.each(Box_No_List,function(key,value){
            console.log("key : " + key + " / " + "value : " + JSON.stringify(value));
            $.each(value,function(key,value){
                console.log("key : " + key + " / " + "value : " + JSON.stringify(value));
            });
        });

        save();
    }

    var save = function() {
        saveflag = true;
        networkManager.httpSend({
            server: saveUserCo,
            path: 'api/PR_PDA_ST_050_C1.do',
            data: {
                'param1': Box_No_List
            },
            success: function(receivedData, setting) {
                if(receivedData.result=="S"){
                    popupManager.instance($("[data-lng='MSG.0000000272']").text(), {showtime:"LONG"}); // 저장이 완료되었습니다
                    clearAfterSave();
                }else{
                    popupManager.instance(receivedData.result, {showtime:"LONG"}); // 저장 실패
                    clear();
                }
            },
            error: function(errorCode, errorMessage, settings) {
                console.log("Save error");
                Box_No_List.length = 0;
                saveflag = false;
            }
        });
    }

    var setClearClickEvent = function(){
        clear();
    };

    // 화면 초기화
    var clear = function() {
        $("#selPLANT").attr("disabled",false);
        $("#selLOCTP").attr("disabled",false);

        $("#selPROC").val("").prop("selected", true);
        $("#PROC_FROM").val("");
        $("#PROC_TO").val("");
        $("#chk_Info").prop("checked",false);
        $("#chk_Info2").prop("checked",false);

        $("#txtPART_CD").text("");
        $("#txtVENDOR_NM").text("");
        $("#BOX_IN_QTY").val(0);
        $("#BOX_QTY").val(0);
        $("#REMAIN_QTY").val(0);
        $("#TOT_QTY").val(0);

        VENDOR_CD = "";
        inv_flag = "";
        Box_No_List.length = 0;
        saveflag = false;
        $("#inputScan").focus();
    }

    // 화면 초기화(저장후 초기화 시, 공정정보는 유지한다.)
    var clearAfterSave = function() {
        $("#chk_Info").prop("checked",false);
        $("#chk_Info2").prop("checked",false);

        $("#txtPART_CD").text("");
        $("#txtVENDOR_NM").text("");
        $("#BOX_IN_QTY").val(0);
        $("#BOX_QTY").val(0);
        $("#REMAIN_QTY").val(0);
        $("#TOT_QTY").val(0);

        VENDOR_CD = "";
        inv_flag = "";
        Box_No_List.length = 0;
        saveflag = false;
        $("#inputScan").focus();
    }

    var inputEvent = function(obj) {
        console.log("BOX_IN_QTY : "+$("#BOX_IN_QTY").val());
        console.log("BOX_QTY : "+$("#BOX_QTY").val());
        console.log("REMAIN_QTY : "+$("#REMAIN_QTY").val());

        var box_in_qty = parseInt($("#BOX_IN_QTY").val());
        var box_qty = parseInt($("#BOX_QTY").val());
        var remain_qty = parseInt($("#REMAIN_QTY").val());

        if(isNaN(box_in_qty)){
            $("#BOX_IN_QTY").val(0);
            $("#BOX_IN_QTY").click();
            box_in_qty = 0;
        }
        if(isNaN(box_qty)){
            $("#BOX_QTY").val(0);
            $("#BOX_QTY").click();
            box_qty = 0;
        }
        if(isNaN(remain_qty)){
            $("#REMAIN_QTY").val(0);
            $("#REMAIN_QTY").click();
            remain_qty = 0;
        }

        var mul = box_in_qty * box_qty;
        var sum = remain_qty + mul

        console.log("mul : " + mul);
        console.log("sum : " + sum);
        $("#TOT_QTY").val(sum);
    };

    // 가공 처리한 부품식별표 데이터
    var qrcode_callback = function(qrcode) {
        lp_box_no = qrcode.lp_Box_No();          // SCAN DATA BOX NO 추출
        lp_part_no = qrcode.lp_Box_PartNo();     // SCAN DATA PART_NO 추출
        lp_box_qty = qrcode.lp_Order_Qty();      // SCAN DATA BOX QTY 추출
        lp_box_lot_no = qrcode.lp_LotNo();       // SCAN DATA LOT_NO 추출
        lp_box_BoxSeq = qrcode.lp_BoxSeq();      // SCAN DATA Box Sequence 추출
        lp_box_Prt = qrcode.lp_Prt();            // SCAN DATA 출력 유형 추출
        lp_box_vendcd = qrcode.lp_Vendor();      // SCAN DATA VEND_CD 추출

        console.log("lp_box_no : "+ lp_box_no);
        console.log("lp_part_no : "+ lp_part_no);
        console.log("lp_box_qty : "+ lp_box_qty);
        console.log("lp_box_lot_no : "+ lp_box_lot_no);
        console.log("lp_box_BoxSeq : "+ lp_box_BoxSeq);
        console.log("lp_box_Prt : "+ lp_box_Prt);
        console.log("lp_box_vendcd : "+ lp_box_vendcd);
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