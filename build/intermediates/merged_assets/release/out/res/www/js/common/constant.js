/**
 * Created by KangHyungWon on 2015. 12. 22..
 *
 * CONSTANT.js
 *
 * 화면에서 사용하는 공통 상수들은 여기에 기술된다.
 */

var CONSTANT = {
	DEVELOPMENT_MODE: 'DEV',

	//  네트워크 관련 상수
	NETWORK: {
		// 개발/운영서버 이름
		SERVER: {
		    HPT: 'HPT',
			HPT2: 'HPT2',
			DEV_SERVER: 'DEV_SERVER',
			DEV: 'DEV',
			DG: 'DG',
			KJ: 'KJ',
			PTA: 'PTA',
			GAST: 'GAST',
			ILST: 'ILST',
			ABST: 'ABST',
			ARST: 'ARST',
			PTM: 'PTM',
			PTI: 'PTI',
			PTC: 'PTC'
		},

		// 전송방식(Default: POST)
		METHOD: 'POST',

		// Indicator는 기본적으로 취소할 수 없게 표시한다.
		INDICATOR: {
			show : true,

			// 문구는 필요 시 수정
			/*message : '데이터 송수신 중입니다.\n잠시만 기다려 주세요.',*/
			cancelable : false
		},

		ERROR_CODE: {
			LOGIN_FAILED: '600',
			REQUIRE_LOGIN: '610',
			COM_TIMEOUT: '620',
			CUS_TIMEOUT: '630',
			SSO_FAILED: '650',
			SERVER_ERROR: '500',
			SOCKET_TIMEOUT: '700',
			SYSTEM_ERROR: '800',
			RETRY: '810',
			SESSION_TIMEOUT: '999'
		},

//		UPLOAD_URL: 'https://madp.hyundai-transys.com:480/api/ImageFileUpload.do',
//		IMAGE_URL: 'https://madp.hyundai-transys.com:480/api/image/'

		UPLOAD_URL: 'http://10.135.198.122:8080/api/ImageFileUpload.do',
        IMAGE_URL: 'http://10.135.198.122:8080/api/image/'

	},

	// 화면 scroll 시 1 페이지당 보여줄 size
	DEFAULT_PAGE_COUNT: 50,

	// 메인은 게시물을 4개만 보여준다
	DEFAULT_MAIN_NOTICE_COUNT: 4,

	// 기본 위경도
	DEFAULT_RADIUS: 3,

	// M.pop.alert의 기본 버튼
	DEFAULT_BUTTON: ['확인'],

	// 기본 날짜포맷
	DATE_FORMAT: {
		YMD: 'YYYYMMDD',
		HMS: 'HHmmss',
		FULL: 'YYYYMMDDHHmmss'
	}
};

(function() {
	Object.freeze(CONSTANT);
})();