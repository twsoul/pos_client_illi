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

    var blockMultiTap = false; // 리스트 중복 탭 방지 플래그

	// 화면 초기화
	var setInitScreen = function() {
	    if (getUSER_NM == "" || getUSER_NM == "undefined" || getUSER_NM == undefined) {
            screenManager.moveToPage('../common/login.html', { action: 'CLEAR_TOP' });
        }

        PlantReq();
	};

	// 이벤트 초기화
	var setInitEvent = function() {
        // 플랜트 변경 시 자동창고 리스트 신규 호출
        $("#selPLANT").on('change', function() {
            clear();
            listSearch();
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
                    listSearch();
                }
            }
        });
    };

    // 출고지시(자동창고) 부품식별표 정보 조회
    var listSearch = function() {
        networkManager.httpSend({
            server: saveUserCo,
            path: 'api/OT_100_S1.do',
            data: {
                'PLANT_CD': $("#selPLANT option:selected").val(),
                'USER_ID': getUSER_ID
            },
            success: function(receivedData, setting) {
                if(receivedData.ListCount == 0){
                    popupManager.instance($("[data-lng='MSG.0000000009']").text(), {showtime:"LONG"}); // 조회 데이터가 없습니다
                    return;
                }
                var rowData = receivedData.ListData[0];

                $("#list_ot_100_head").removeClass("blind");
                $.each(receivedData.ListData, function(index,rowData){
                    var exists = false;
                    var tag = "";
                    var template = $("#ListTemplate").html();
                    console.log("PLANT_CD : "+rowData.PLANT_CD);
                    console.log("PART_NO : "+rowData.PART_NO);
                    console.log("PART_NM : "+rowData.PART_NM);
                    console.log("BOX_CNT : "+rowData.BOX_CNT);


                    $("#list_ot_100 .tableCont").each(function() {
                        if($(this).find(".PART_NO").text() == rowData.PART_NO){ // 품번이 같은 부품식별표 개수 추가
                            $(this).find(".TOT_QTY").text(parseInt($(this).find(".TOT_QTY").text()) + parseInt(rowData.INV_QTY));
                            $(this).find(".SCAN_BOX_CNT").text(parseInt($(this).find(".SCAN_BOX_CNT").text()) + 1);
                            exists = true;
                        }
                    });
                    if(!exists){
                        tag += template.replace(/\{\{PLANT_CD\}\}/, rowData.PLANT_CD)
                                       .replace(/\{\{PART_NO\}\}/gi, rowData.PART_NO)
                                       .replace(/\{\{PART_NM\}\}/gi, rowData.PART_NM)
                                       .replace(/\{\{BOX_CNT\}\}/gi, rowData.BOX_CNT)
                                       .replace(/\{\{MLINK\}\}/, "mLink");
                        $("#list_ot_100").append(tag);
                    }
                });
                setListRowEvent();
            }
        });
    }

    // 리스트에 클릭 이벤트 등록
    var setListRowEvent = function(){
        $(".mLink").off("click","**");
        $(".mLink").on("click", function(){
            if(!blockMultiTap){ // 중복 리스트 클릭 방지
                blockMultiTap = true;
                screenManager.moveToPage("OT_101.html", { // 리스트 클릭시 OT_101.html 로 이동
                    param: {
                        PLANT_CD: M.sec.encrypt($("#selPLANT option:selected").val()).result,
                        PART_NO: M.sec.encrypt($(this).find(".PART_NO").text()).result,
                        PART_NM: M.sec.encrypt($(this).find(".PART_NM").text()).result,
                        TOT_QTY: M.sec.encrypt($(this).find(".BOX_CNT").text()).result
                    }
                });
            }
        })
    };

    // 화면 초기화
    var clear = function() {
        $("#list_ot_100_head").addClass("blind");
        $("#list_ot_100").html("");
        blockMultiTap = false;
    }

    // 자식창에 갔다가 돌아왔을때 리로드용
	var setReloadEvent = function() {
	    // 다시 돌아왔을 때 화면 초기화 하고 리스트 재조회
	    clear();
	    listSearch();
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