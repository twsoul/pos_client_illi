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
    var saveflag = false;

    var C1_LIST = [];

    var Tot_Move_Qty = 0;
    var Tot_Scan_Qty = 0;

	// 화면 초기화
	var setInitScreen = function() {
	    if (getUSER_NM == "" || getUSER_NM == "undefined" || getUSER_NM == undefined) {
            screenManager.moveToPage('../common/login.html', { action: 'CLEAR_TOP' });
        }
        // 화면 초기화시 공장, 저장위치, 사외창고 콤보박스 조회
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

        // 플랜트 변경 시 저장위치 재조회
        $("#selPLANT").on('change', function() {
            StorageLocationReq();
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
                    StorageLocationReq();
                }
            }
        });
    };

    // 저장 위치 콤보박스 정보 조회
    var StorageLocationReq = function() {
        networkManager.httpSend({
            server: saveUserCo,
        	path: 'api/LocCodeList.do',
        	data: {
            	'PLANT': $("#selPLANT option:selected").val(),
            	'TYPE': ["50"]
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
        $("#inputScan").focus();
    }

    // 사외창고 콤보박스 정보 조회
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
        if($("#txtORDR_NO").text()== ""){
            MoveScan(inputScan);
        } else {
            if(Tot_Move_Qty == Tot_Scan_Qty && Tot_Move_Qty != 0){
                popupManager.instance($("[data-lng='MSG.0000000770']").text(), {showtime:"LONG"}); // 지시수량을 초과하여 스캔 할 수 없습니다
                $("#inputScan").focus();
                return;
            }
            PalletScan(inputScan);
        }
    }

    var MoveScan = function(move_no){
        networkManager.httpSend({
            server: saveUserCo,
            path: 'api/KD_200_S1.do',
            data: {
                'MOVE_NO':move_no,
                'event':'반출 정보 조회'
            },
            success: function(receivedData, setting) {
                var rowData = receivedData.ListData[0];

                if(receivedData.ListCount == 0){
                    popupManager.instance($("[data-lng='MSG.0000000287']").text(), {showtime:"LONG"}); // 반출 번호가 존재하지 않습니다
                    $("#inputScan").focus();
                    return;
                }
                if(rowData.PLANT_CD != $("#selPLANT").val()){
                    popupManager.instance($("[data-lng='MSG.0000000297']").text(), {showtime:"LONG"}); // 타 공장 바코드입니다
                    $("#inputScan").focus();
                    return;
                }
                if (rowData.MOVE_YN == "Y") {
                    popupManager.instance($("[data-lng='MSG.0000000777']").text(), {showtime:"LONG"}); // 이미 입고처리된 반출증입니다
                    $("#inputScan").focus();
                    return;
                }

                $("#selPLANT").attr("disabled",true);
                $("#selLOCTP").attr("disabled",true);
                $("#selLOGI").attr("disabled",true);
                $("#list_kd_200_head").removeClass("blind");
                $("#txtORDR_NO").text(move_no);

                var template = $("#ListTemplate").html();
                var tag = "";
                $.each(receivedData.ListData, function(index,rowData){
                    tag += template.replace(/\{\{PALLET_NO\}\}/, rowData.PALLET_NO)
                                   .replace(/\{\{PART_CD\}\}/, rowData.PART_CD)
                                   .replace(/\{\{MOVE_QTY\}\}/, rowData.MOVE_QTY)
                                   .replace(/\{\{SCAN_FLAG\}\}/, "N");

                    Tot_Move_Qty++;
                });
                $("#list_kd_200").append(tag);
                $("#inputScan").focus();
            }
        });
    };

    // Pallet 조회 함수
    var PalletScan = function(plt_no){
        networkManager.httpSend({
            server: saveUserCo,
            path: 'api/selectVwPallet.do',
            data: {
                'COPORATE_CD':getCORP_CD,
                'PLANT_CD':$("#selPLANT").val(),
                'PLT_NO':plt_no,
                'event':'팔레트 정보 조회'
            },
            success: function(receivedData, setting) {
                var rowData = receivedData.ListData[0];

                if(receivedData.ListCount == 0){
                    popupManager.instance($("[data-lng='MSG.0000000359']").text(), {showtime:"LONG"}); // 팔레트 정보가 존재하지 않습니다
                    $("#inputScan").focus();
                    return;
                }
                if(rowData.PLT_LOC_CD != "A04"){
                    popupManager.instance($("[data-lng='MSG.0000000670']").text(), {showtime:"LONG"}); // 운송중인 팔레트가 아닙니다
                    $("#inputScan").focus();
                    return;
                }
                if(rowData.MAP_QTY < 1){
                    popupManager.instance($("[data-lng='MSG.0000000668']").text(), {showtime:"LONG"}); // 공팔레트 입니다
                    $("#inputScan").focus();
                    return;
                }
                var exists = false;

                // 팔레트 중복 스캔 방지
                $.each(C1_LIST,function(key,value){
                      $.each(value,function(key,value){
                            if(value == plt_no){
                                exists = true;
                            }
                      });
                 });

                if(exists){
                    popupManager.instance($("[data-lng='MSG.0000000394']").text(), {showtime:"LONG"}); // 이미 스캔한 팔레트입니다
                    $("#inputScan").focus();
                    return;
                }

                $("#list_kd_200 .tableCont").each(function() {
                    if($(this).find(".PALLET_NO").text() == plt_no){
                        Tot_Scan_Qty++;
                        $("#inpBoxQty").text(parseInt($("#inpBoxQty").text())+1);
                        if(Tot_Scan_Qty == Tot_Move_Qty){
                            $("#inpBoxQty").removeAttr('class').addClass("nBluebox1");
                        }
                        $(this).data("scanflag","Y");
                        $(this).find(".PALLET_NO").removeClass("nRedbox1").addClass("nBluebox1");
                        $(this).appendTo('div .list_kd_200:eq(1)');
                        C1_LIST.push({"COPORATE_CD":getCORP_CD, "PLANT_CD":$("#selPLANT").val(), "LOC_TP":$("#selLOCTP").val(), "LOGI_CD":$("#selLOGI").val(), "MOVE_NO":$("#txtORDR_NO").text(), "PLT_NO":plt_no, "USER_ID":getUSER_ID, "RTN_MSG":""});
                    }
                });
                $("#inputScan").focus();
            }
        });
    }

    // 저장 조건 처리 로직
    var setSaveClickEvent = function(){
        if(saveflag){ return; }
        if($("#inpBoxQty").text() == "0"){
            popupManager.instance($("[data-lng='MSG.0000000137']").text(), {showtime:"LONG"}); // 스캔하신 내역이 없습니다
            $("#inputScan").focus();
            return;
        }

        if(Tot_Scan_Qty < Tot_Move_Qty){
            popupManager.alert($("[data-lng='MSG.0000000274']").text(), { // 미납 되었습니다, 그래도 저장 하시겠습니까?
            title: $("[data-lng='MSG.0000000004']").text(), // 알림
            buttons: [$("[data-lng='MSG.0000000002']").text(), $("[data-lng='MSG.0000000003']").text()] // 확인, 취소
            }, function(index) {
                if (index == 1){
                    $("#inputScan").focus();
                    return;
                } else {
                    save();
                }
            });
        }else{
            save();
        }
    }

    // 저장 처리
    var save = function() {
        networkManager.httpSend({
            server: saveUserCo,
            path: 'api/PR_PDA_KD_200_C1.do',
            data: {
                'param1': C1_LIST
            },
            success: function(receivedData, setting) {
                if(receivedData.result=="S"){
                    if(Tot_Scan_Qty < Tot_Move_Qty){
                        save2();
                    }else{
                        popupManager.instance($("[data-lng='MSG.0000000272']").text(), {showtime:"LONG"}); // 저장이 완료되었습니다
                        clear();
                    }
                }else{
                    popupManager.instance($("[data-lng='MSG.0000000373']").text(), {showtime:"LONG"}); // 저장에 실패하였습니다
                }
            },
            error: function(errorCode, errorMessage, settings) {
                popupManager.instance($("[data-lng='MSG.0000000373']").text(), {showtime:"LONG"}); // 저장에 실패하였습니다
            }
        });
    }

    var save2 = function() {
        saveflag = true;
        var C2_LIST = [];

        $("#list_kd_200 .tableCont").each(function() {
            if($(this).data("scanflag") == "N"){
                C2_LIST.push({"COPORATE_CD":getCORP_CD, "PLANT_CD":$("#selPLANT").val(), "LOC_TP":$("#selLOCTP").val(), "LOGI_CD":$("#selLOGI").val(), "MOVE_NO":$("#txtORDR_NO").text(), "PLT_NO":$(this).find(".PALLET_NO").text(), "USER_ID":getUSER_ID, "RTN_MSG":""});
            }
        });

        networkManager.httpSend({
            server: saveUserCo,
            path: 'api/PR_PDA_KD_200_C2.do',
            data: {
                'param1': C2_LIST
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
        C1_LIST.length = 0;

        $("#txtORDR_NO").text("");

        Tot_Move_Qty = 0;
        Tot_Scan_Qty = 0;

        $("#list_kd_200").html("");
        $("#list_kd_200_head").addClass("blind");
        $("#inpBoxQty").text("0").removeAttr('class').addClass("nRedbox1");
        $("#selPLANT").attr("disabled",false);
        $("#selLOCTP").attr("disabled",false);
        $("#selLOGI").attr("disabled",false);
        saveflag = false;
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