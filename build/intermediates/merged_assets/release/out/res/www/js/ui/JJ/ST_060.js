/*******************************************************************
*	페이지 로직
*******************************************************************/

var page = (function(window, document, $, M, undefined) {
    var getCORP_CD = userManager.getCORP_CD();
    var getUSER_NM = userManager.getUSER_NM();
    var getUSER_ID = userManager.getUSER_ID();
    var getWERKS = optionManager.getWERKS();
    var getLGORT = optionManager.getLGORT();
    var getLNG = optionManager.getLNG();
    var saveUserCo = dataManager.storage('saveUserCo');

    var lp_box_no = "";
    var lp_part_no = "";
    var lp_box_qty = "";
    var lp_box_lot_no = "";
    var lp_box_BoxSeq = "";
    var lp_box_Prt = "";
    var lp_box_vendcd = "";

    var Box_No_List = [];
    var Box_No_Arr = [];

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
            StorageLocationReq("10");
        })

        // 저장위치 변경 시 스캔 포커스
        $("#selLOCTP").on('change', function (e) {
            InvDumpReq();
            //$("#inputScan").focus();
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
                    StorageLocationReq("10");
                }
            }
        });
    };

    // 저장위치 콤보박스 정보 조회
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
                tag += "<option value=''>"+$("[data-lng='LB.0000000119']").text()+"</option>"; // 선택
                if(receivedData.ListCount != 0){
                     $.each(receivedData.ListData, function(index,rowData){
                        tag += "<option value='" + rowData.LOC_TP + "'>" + rowData.LOC_NM + "</option>";
                     });
                }
                $("#selLOCTP").append(tag);
                if($("#selPLANT").val() == getWERKS) {
                    $("#selLOCTP").val(getLGORT).prop("selected", true);
                }
                InvDumpReq();
            }
        });
        $("#inputScan").focus();
    }

    // 전체재고실사 진행여부 조회
    var InvDumpReq = function() {
        networkManager.httpSend({
            server: saveUserCo,
            path: 'api/selectInvDumpExists.do',
            data: {
                'COPORATE_CD': getCORP_CD,
                'PLANT_CD': $("#selPLANT option:selected").val(),
                'LOC_TP': $("#selLOCTP option:selected").val(),
                'event':'전체재고실사 진행여부 조회'
            },
            success: function(receivedData, setting) {
                var rowData = receivedData.ListData[0];
                inv_flag = rowData.INV_FLAG;
                if(rowData.INV_FLAG =="N"){
                    popupManager.instance($("[data-lng='MSG.0000000582']").text(), {showtime:"LONG"}); //전체 재고실사가 진행중입니다. 확정 후 사용 가능합니다.
                    $("#inputScan").focus();
                    return;
                }
            }
        });
        $("#inputScan").focus();
    }

    // 스캔 시 처리 로직
    var ScanValidation = function(inputScan) {
        inputScan = upperManager.Upper(inputScan);
        var userPlantCheck = $("#selPLANT").val();
        var userLocTpCheck = $("#selLOCTP").val();

        if(userPlantCheck == null){
            popupManager.instance($("[data-lng='MSG.0000000118']").text(), {showtime:"LONG"}); // 플랜트를 먼저 선택하십시오
            return;
        }if(userLocTpCheck == ""){
            popupManager.instance($("[data-lng='MSG.0000000117']").text(), {showtime:"LONG"}); // 저장위치를 먼저 선택하십시오
            return;
        }
        if(inv_flag =="N"){
            popupManager.instance($("[data-lng='MSG.0000000582']").text(), {showtime:"LONG"}); // 전체 재고실사가 진행중입니다. 확정 후 사용 가능합니다.
            $("#inputScan").focus();
            return;
        }
        if(inputScan.length > 0) {
            CheckRealInvExists(inputScan);
            //BoxNoScan(inputScan);
        }
    }

    // 아직 확정안한 기 스캔 박스 있는지 체크(공장별 비즈니스로직 PDA02 사용)
    var CheckRealInvExists = function(box_barcode) {
        networkManager.httpSend({
            server: saveUserCo,
            path: 'api/selectRealInvExists.do',
            data: {
                'COPORATE_CD': getCORP_CD,
                'PLANT_CD': $("#selPLANT option:selected").val(),
                'LOC_TP': $("#selLOCTP option:selected").val(),
                'BOX_BAR_NO' : box_barcode,
                'INV_TYPE' : 'U', //단위재고실사
                'event':'기 스캔여부 조회'
            },
            success: function(receivedData, setting) {
                var rowData = receivedData.ListData[0];
                if(rowData.INV_FLAG =="Y"){
                    popupManager.instance($("[data-lng='MSG.0000000269']").text(), {showtime:"LONG"}); // 이미 스캔한 부품식별표입니다
                    $("#inputScan").focus();
                    return;
                } else {
                    BoxNoScan(box_barcode);
                }
            }
        });
    }

    // 부품식별표 조회 함수
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
                var bar_exists = false;

                if(receivedData.ListCount == 0){
                    barcodeProcessing(box_barcode);
                    return;
                }
                /*
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
                }*/
                if (rowData.TRANS_TYPE == "MAAR") {
                    popupManager.instance($("[data-lng='MSG.0000000505']").text(), {showtime:"LONG"}); // 검사중이므로 실사할 수 없습니다
                    $("#inputScan").focus();
                    return;
                }
                /*
                if (rowData.BAR_QTY < 1) {
                    popupManager.instance($("[data-lng='MSG.0000000455']").text(), {showtime:"LONG"}); // 사용할 수 없는 부품식별표 입니다
                    $("#inputScan").focus();
                    return;
                }*/

                // 부품식별표 중복 스캔 체크
                Box_No_Arr.forEach(function(arr){
                    if(rowData.BOX_NO == arr){
                        bar_exists = true;
                    }
                });
                if(!bar_exists){
                    Box_No_Arr.push(rowData.BOX_NO);
                } else {
                    popupManager.instance($("[data-lng='MSG.0000000269']").text(), {showtime:"LONG"}); // 이미 스캔한 부품식별표입니다
                    $("#inputScan").focus();
                    return;
                }

                // 스캔 시 플랜트, 저장위치 선택 불가
                $("#selPLANT").attr("disabled",true);
                $("#selLOCTP").attr("disabled",true);

                $("#inpBoxQty").text(parseInt($("#inpBoxQty").text())+1);
                //품번, 재고박스, 재고수 표시
                $("#txtPART_CD").text(rowData.PART_CD);
                $("#txtTOTAL_INV_QTY").text(rowData.TOTAL_INV_QTY);
                $("#txtTOTAL_BOX_QTY").text(rowData.TOTAL_BOX_QTY);

                var tag = "";
                var template = $("#ListTemplate").html();

                $("#list_st_060_head").removeClass("blind");
                tag += template.replace(/\{\{COPORATE_CD\}\}/, rowData.COPORATE_CD)
                               .replace(/\{\{PLANT_CD\}\}/, rowData.PLANT_CD)
                               .replace(/\{\{LOC_TP\}\}/, rowData.LOC_TP)
                               .replace(/\{\{BOX_NO\}\}/gi, rowData.BOX_NO)
                               .replace(/\{\{PART_CD\}\}/gi, rowData.PART_CD)
                               .replace(/\{\{BAR_QTY\}\}/gi, rowData.BAR_QTY)
                               .replace(/\{\{REAL_QTY\}\}/gi, rowData.BAR_QTY)
                               .replace(/\{\{VENDOR_CD\}\}/, rowData.VENDOR_CD)
                               .replace(/\{\{VENDOR_NM\}\}/, rowData.VENDOR_NM)
                               .replace(/\{\{BOX_BAR_NO\}\}/, rowData.BOX_BAR_NO);
                $("#list_st_060").prepend(tag);
                $("#inputScan").focus();
            }
        });
    };

    var barcodeProcessing = function(barcode){
        var qrCode = new qrManager.QRcode(barcode);
        var exists = false;
        var bar_exists = false;

        if(!qrManager.isValidBarcode(qrCode)){
            console.log("fail");
            return;
        }
        qrcode_callback(qrCode);

        if (lp_box_qty < 1) {
            popupManager.instance($("[data-lng='MSG.0000000455']").text(), {showtime:"LONG"}); // 사용할 수 없는 부품식별표 입니다
            $("#inputScan").focus();
            return;
        }

        // 부품식별표 중복 스캔 체크
        Box_No_Arr.forEach(function(arr){
            if(lp_box_no == arr){
                bar_exists = true;
            }
        });
        if(!bar_exists){
            Box_No_Arr.push(lp_box_no);
        } else {
            popupManager.instance($("[data-lng='MSG.0000000269']").text(), {showtime:"LONG"}); // 이미 스캔한 부품식별표입니다
            $("#inputScan").focus();
            return;
        }

        // 스캔 시 플랜트, 저장위치 선택 불가
        $("#selPLANT").attr("disabled",true);
        $("#selLOCTP").attr("disabled",true);

        $("#inpBoxQty").text(parseInt($("#inpBoxQty").text())+1);
        var tag = "";
        var template = $("#ListTemplate").html();

        $("#list_st_060_head").removeClass("blind");
        tag += template.replace(/\{\{COPORATE_CD\}\}/, getCORP_CD)
                       .replace(/\{\{BOX_NO\}\}/gi, lp_box_no)
                       .replace(/\{\{PART_CD\}\}/gi, lp_part_no)
                       .replace(/\{\{BAR_QTY\}\}/gi, 0) //BOX_MA에 없는 식별표 스캔의 경우 바코드 수량 0으로 처리
                       .replace(/\{\{REAL_QTY\}\}/gi, lp_box_qty)
                       .replace(/\{\{VENDOR_CD\}\}/, lp_box_vendcd)
                       .replace(/\{\{BOX_BAR_NO\}\}/, barcode);
        $("#list_st_060").prepend(tag);
        $("#inputScan").focus();

    }

    // 저장 조건 처리 로직
    var setSaveClickEvent = function(){
        if(saveflag){ return; }
        var save_Chk = true;
        if($("#inpBoxQty").text() == "0"){
            popupManager.instance($("[data-lng='MSG.0000000137']").text(), {showtime:"LONG"}); // 스캔하신 내역이 없습니다
            $("#inputScan").focus();
            return;
        }
        $("#list_st_060 .tableCont").each(function() {
            Box_No_List.push({"COPORATE_CD":$(this).data("coperatecd"),"PLANT_CD":$("#selPLANT").val(), "LOC_TP":$("#selLOCTP").val(), "BOX_NO":$(this).data("boxno"), "VENDOR_CD":$(this).data("vendcd"), "PART_CD":$(this).data("partcd"), "BAR_QTY":$(this).data("barqty"), "SCAN_QTY":$(this).find(".REAL_QTY").val(), "USER_ID":getUSER_ID, "USER_NM":getUSER_NM, "BOX_BAR_NO":$(this).data("boxbarno"),"RTN_MSG":"" })
        });

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
            path: 'api/PR_PDA_ST_060_C1.do',
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
        $("#list_st_060").html("");
        $("#selPLANT").attr("disabled",false);
        $("#selLOCTP").attr("disabled",false);

        $("#list_st_060_head").addClass("blind");

        lp_box_no = "";
        lp_part_no = "";
        lp_box_qty = "";
        lp_box_lot_no = "";
        lp_box_BoxSeq = "";
        lp_box_Prt = "";
        lp_box_vendcd = "";

        $("#inpBoxQty").text("0");
        Box_No_List.length = 0;
        Box_No_Arr.length = 0;
        saveflag = false;
        $("#inputScan").focus();
    }

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

    var inputEvent = function(obj) {
        $(obj).val()

        if($(obj).val() == ""){
            $(obj).val(0);
            $(obj).click();
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