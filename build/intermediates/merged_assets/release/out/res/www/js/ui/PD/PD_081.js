/*******************************************************************
*	페이지 로직
*******************************************************************/

var page = (function(window, document, $, M, undefined) {
    var getCORP_CD = userManager.getCORP_CD();
    var getUSER_NM = userManager.getUSER_NM();
    var getUSER_ID = userManager.getUSER_ID();
    var getWERKS = optionManager.getWERKS();
    var getVEND_CD = userManager.getVEND_CD();
    var getLNG = optionManager.getLNG();
    var saveUserCo = dataManager.storage('saveUserCo');

    var blockMultiTap = false; // 리스트 중복 탭 방지 플래그

	// 화면 초기화
	var setInitScreen = function() {
        if (getUSER_NM == "" || getUSER_NM == "undefined" || getUSER_NM == undefined) {
           screenManager.moveToPage('../common/login.html', { action: 'CLEAR_TOP' });
        }

        $("#txtUSER_NM").text(getUSER_NM);
        CarNoReq();
	};

	// 이벤트 초기화
	var setInitEvent = function() {
        // 차량정보 변경 시 리스트 정보 호출
        $("#selCARNO").on('change', function (e) {
            clear();
            ListInfo();
        })
    };

    // 차량정보 콤보박스 정보 조회
    var CarNoReq = function() {
        if(getVEND_CD == undefined || getVEND_CD == "undefined" || getVEND_CD == null){
            getVEND_CD = "";
        }
        console.log("COPORATE_CD : "+getCORP_CD);
        console.log("VENDOR_CD : "+getVEND_CD);
        console.log("USER_ID : "+getUSER_ID);
        networkManager.httpSend({
            server: saveUserCo,
            path: 'api/PD_081_S1.do',
            data: {
                'COPORATE_CD': getCORP_CD,
                'VENDOR_CD': "D008", // getVEND_CD,
                'USER_ID': getUSER_ID
            },
            success: function(receivedData, setting) {
                var tag = "";
                $("#selCARNO").html("");
                tag += "<option value=''>"+$("[data-lng='LB.0000000119']").text()+"</option>"; // 선택
                if(receivedData.ListCount != 0){
                     $.each(receivedData.ListData, function(index,rowData){
                        tag += "<option value='" + rowData.CAR_NO + "'>" + rowData.CAR_NO + "</option>";
                     });
                }
                $("#selCARNO").append(tag);
            }
        });
    };

    // 차량정보 리스트 정보 조회 함수
    var ListInfo = function() {
        if($("#selCARNO").val() == ""){
            return;
        }
        console.log("PLANT_CD : "+getWERKS);
        networkManager.httpSend({
            server: saveUserCo,
            path: 'api/PD_081_S2.do',
            data: {
                'CAR_NO': $("#selCARNO option:selected").val(),
                'PLANT_CD': getWERKS,
                'event':'차량정보 리스트 정보 조회'
            },
            success: function(receivedData, setting) {
                var rowData = receivedData.ListData[0];
                var bar_exists = false;
                var index = 0;

                if(receivedData.ListCount == 0){
                    $("#selCARNO").val("").prop("selected", true);
                    popupManager.instance($("[data-lng='MSG.0000000407']").text(), {showtime:"LONG"}); // 해당 차량에 대한 배차정보가 존재하지 않습니다
                    return;
                }

                var tag = "";
                var template = $("#ListTemplate").html();

                $("#list_pd_081_head").removeClass("blind");

                $.each(receivedData.ListData, function(index,rowData){
                    tag += template.replace(/\{\{CAR_NO\}\}/gi, rowData.CAR_NO)
                                   .replace(/\{\{DELI_DT\}\}/gi, rowData.DELI_DT)
                                   .replace(/\{\{DELI_CAR_SEQ\}\}/gi, rowData.DELI_CAR_SEQ)
                                   .replace(/\{\{ZONE_TO\}\}/gi, rowData.ZONE_TO)
                                   .replace(/\{\{MLINK\}\}/, "mLink");
                });

                $("#list_pd_081").append(tag);
                setListRowEvent();
            }
        });
    };

    // 리스트에 클릭 이벤트 등록
    var setListRowEvent = function(){
        $(".mLink").off("click","**");
        $(".mLink").on("click", function(){
            if(!blockMultiTap){ // 중복 리스트 클릭 방지
                blockMultiTap = true;
                console.log("CAR_NO :"+$(this).data("carno"));
                console.log("DELI_DT :"+$(this).find(".DELI_DT").text());
                console.log("DELI_CAR_SEQ :"+$(this).find(".DELI_CAR_SEQ").text());
                console.log("ZONE_TO :"+$(this).find(".ZONE_TO").text());
                screenManager.moveToPage("PD_082.html", { // 리스트 클릭시 PD_082.html 로 이동
                    param: {
                        CAR_NO: M.sec.encrypt($(this).data("carno")).result,
                        DELI_DT: M.sec.encrypt($(this).find(".DELI_DT").text()).result,
                        DELI_CAR_SEQ: M.sec.encrypt($(this).find(".DELI_CAR_SEQ").text()).result,
                        ZONE_TO: M.sec.encrypt($(this).find(".ZONE_TO").text()).result
                    }
                });
            }
        })
    };

    var setClearClickEvent = function(){
        clear();
    };

    // 화면 초기화
    var clear = function() {
        $("#list_pd_081").html("");
        $("#list_pd_081_head").addClass("blind");
        blockMultiTap = false;
    }

	// 자식창에 갔다가 돌아왔을때 리로드용
	var setReloadEvent = function() {
        // 다시 돌아왔을 때 화면 초기화 하고 리스트 재조회
        console.log("setReloadEvent");
	    clear();
	    ListInfo();
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