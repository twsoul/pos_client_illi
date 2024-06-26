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

    var Box_No_Arr = [];
    var Box_No_List = [];
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
            StorageLocationReq("40");
        })

        // 저장위치 변경 시 창고 콤보박스 신규 호출
        $("#selLOCTP").on('change', function (e) {
            WHCodeReq();
            InvDumpReq();
        })

        // 창고 변경 시 스캔 포커스
        $("#selWH").on('change', function (e) {
            $("#inputScan").focus();
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
                    StorageLocationReq("40");
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
                if(receivedData.ListCount != 0){
                     $.each(receivedData.ListData, function(index,rowData){
                        tag += "<option value='" + rowData.LOC_TP + "'>" + rowData.LOC_NM + "</option>";
                     });
                }
                $("#selLOCTP").append(tag);
                WHCodeReq();
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

                inv_flag = rowData.INV_FLAG;
                if(rowData.INV_FLAG =="N"){
                    popupManager.instance($("[data-lng='MSG.0000000503']").text(), {showtime:"LONG"}); // 전체 재고실사 덤프데이터가 존재하지 않습니다
                    $("#inputScan").focus();
                    return;
                }
            }
        });
        $("#inputScan").focus();
    }

    // 창고 콤보박스 정보 조회
    var WHCodeReq = function() {
        if($("#selLOCTP").val() == null){
            var tag = "";
            $("#selWH").html("");
            $("#selWH").append(tag);

            return;
        }
        networkManager.httpSend({
            server: saveUserCo,
            path: 'api/selectWHCode.do',
            data: {
                'COPORATE_CD': getCORP_CD,
                'PLANT_CD': $("#selPLANT option:selected").val(),
                'LOC_TP': $("#selLOCTP option:selected").val()
            },
            success: function(receivedData, setting) {
                var tag = "";
                $("#selWH").html("");
                if(receivedData.ListCount != 0){
                     $.each(receivedData.ListData, function(index,rowData){
                        tag += "<option value='" + rowData.WH_CD + "'>" + rowData.WH_NM + "</option>";
                     });
                }
                $("#selWH").append(tag);
            }
        });
        $("#inputScan").focus();
    }

    // 스캔 시 처리 로직
    var ScanValidation = function(inputScan) {
        var userPlantCheck = $("#selPLANT").val();
        var userLocTpCheck = $("#selLOCTP").val();

        if(userPlantCheck == null){
            popupManager.instance($("[data-lng='MSG.0000000118']").text(), {showtime:"LONG"}); // 플랜트를 먼저 선택하십시오
            return;
        }
        if(userLocTpCheck == null){
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
        networkManager.httpSend({
            server: saveUserCo,
            path: 'api/selectKDBoxNo.do',
            data: {
                'BOX_BAR_NO': box_barcode,
                'LANG':getLNG,
                'event':'부품식별표 조회'
            },
            success: function(receivedData, setting) {
                var rowData = receivedData.ListData[0];
                var bar_exists = false;

                if(receivedData.ListCount == 0){
                    popupManager.instance($("[data-lng='MSG.0000000270']").text(), {showtime:"LONG"}); // 부품식별표가 존재하지 않습니다
                    $("#inputScan").focus();
                    return;
                }
                if (rowData.TRANS_TYPE == "MAAR") {
                    popupManager.instance($("[data-lng='MSG.0000000506']").text(), {showtime:"LONG"}); // 입하상태이므로 실사할 수 없습니다
                    $("#inputScan").focus();
                    return;
                }
                /*
                if(rowData.PLANT_CD != $("#selPLANT").val()){
                    popupManager.instance($("[data-lng='MSG.0000000297']").text(), {showtime:"LONG"}); // 타 공장 바코드입니다
                    $("#inputScan").focus();
                    return;
                }
                if(rowData.LOC_TP != $("#selLOCTP").val()) {
                    popupManager.instance($("[data-lng='MSG.0000000302']").text(), {showtime:"LONG"}); // 타 저장위치 바코드입니다
                    $("#inputScan").focus();
                    return;
                }
                if(rowData.LOC_TP_TYPE != 40) {
                    popupManager.instance($("[data-lng='MSG.0000000352']").text(), {showtime:"LONG"}); // 현재 저장위치에 존재하는 부품식별표가 아닙니다
                    $("#inputScan").focus();
                    return;
                }
                if(rowData.WH_CD != $("#selWH").val()) {
                    popupManager.instance($("[data-lng='MSG.0000000378']").text(), {showtime:"LONG"}); // 현재 KD창고에 존재하는 부품식별표가 아닙니다
                    $("#inputScan").focus();
                    return;
                }
                */

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
                $("#selWH").attr("disabled",true);

                $("#inpBoxQty").text(parseInt($("#inpBoxQty").text())+1);
                var tag = "";
                var template = $("#ListTemplate").html();

                $("#list_kd_030_head").removeClass("blind");
                tag += template.replace(/\{\{COPORATE_CD\}\}/, rowData.COPORATE_CD)
                                               .replace(/\{\{PLANT_CD\}\}/, rowData.PLANT_CD)
                                               .replace(/\{\{LOC_TP\}\}/, rowData.LOC_TP)
                                               .replace(/\{\{LOC_TP_TYPE\}\}/, rowData.LOC_TP_TYPE)
                                               .replace(/\{\{WH_CD\}\}/, rowData.WH_CD)
                                               .replace(/\{\{BOX_NO\}\}/gi, rowData.BOX_NO)
                                               .replace(/\{\{MAKE_SEQ\}\}/gi, rowData.MAKE_SEQ)
                                               .replace(/\{\{PART_CD\}\}/gi, rowData.PART_CD)
                                               .replace(/\{\{PART_NM\}\}/, rowData.PART_NM)
                                               .replace(/\{\{BAR_QTY\}\}/gi, rowData.BAR_QTY)
                                               .replace(/\{\{REAL_QTY\}\}/gi, rowData.BAR_QTY)
                                               .replace(/\{\{BASIC_UNIT\}\}/, rowData.BASIC_UNIT)
                                               .replace(/\{\{VENDOR_CD\}\}/, rowData.VENDOR_CD)
                                               .replace(/\{\{VENDOR_NM\}\}/, rowData.VENDOR_NM)
                                               .replace(/\{\{BOX_BAR_NO\}\}/, rowData.BOX_BAR_NO)
                                               .replace(/\{\{BOX_IN_QTY\}\}/, rowData.BOX_IN_QTY)
                                               .replace(/\{\{BOX_OUT_FLAG\}\}/, rowData.BOX_OUT_FLAG)
                                               .replace(/\{\{HOLD_FLAG\}\}/, rowData.HOLD_FLAG);
                $("#list_kd_030").prepend(tag);
                $("#inputScan").focus();
            }
        });

    };

    // 저장 조건 처리 로직
    var setSaveClickEvent = function(){
        if(saveflag){ return; }
        var save_Chk = true;
        if($("#inpBoxQty").text() == "0"){
            popupManager.instance($("[data-lng='MSG.0000000137']").text(), {showtime:"LONG"}); // 스캔하신 내역이 없습니다
            $("#inputScan").focus();
            return;
        }

        $("#list_kd_030 .tableCont").each(function() {
            Box_No_List.push({"COPORATE_CD":$(this).data("coperatecd"),"PLANT_CD":$("#selPLANT").val(), "LOC_TP":$("#selLOCTP").val(), "WH_CD":$("#selWH").val(), "BOX_NO":$(this).data("boxno"), "VENDOR_CD":$(this).data("vendorcd"), "PART_CD":$(this).data("partcd"), "BAR_QTY":$(this).data("barqty"), "SCAN_QTY":$(this).find(".REAL_QTY").val(), "USER_ID":getUSER_ID, "USER_NM":getUSER_NM, "RTN_MSG":"" })
        });

        $.each(Box_No_List,function(key,value){
            console.log("key : " + key + " / " + "value : " + JSON.stringify(value));
            $.each(value,function(key,value){
                console.log("key : " + key + " / " + "value : " + JSON.stringify(value));
            });
        });


        save();
    }

    // 사외 창고 실사 저장
    var save = function() {
        saveflag = true;
        networkManager.httpSend({
            server: saveUserCo,
            path: 'api/PR_PDA_KD_030_C1.do',
            data: {
                'param1': Box_No_List
            },
            success: function(receivedData, setting) {
                if(receivedData.result=="S"){
                    popupManager.instance($("[data-lng='MSG.0000000272']").text(), {showtime:"LONG"}); // 저장이 완료되었습니다
                    clear();
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
        $("#list_kd_030").html("");
        $("#selPLANT").attr("disabled",false);
        $("#selLOCTP").attr("disabled",false);
        $("#selWH").attr("disabled",false);

        $("#list_kd_030_head").addClass("blind");

        Box_No_List.length = 0;
        Box_No_Arr.length = 0;
        inv_flag = "";

        $("#inpBoxQty").text("0");
        saveflag = false;
        $("#inputScan").focus();
    }

    var inputEvent = function(obj) {
        console.log("value : "+ $(obj).val() );
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