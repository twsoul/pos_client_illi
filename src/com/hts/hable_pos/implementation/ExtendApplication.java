package com.hts.hable_pos.implementation;

import android.content.Context;
import android.support.multidex.MultiDex;

import m.client.android.library.core.common.MorpheusApplication;

public class ExtendApplication extends MorpheusApplication {
	public ExtendApplication() {

	}



	// multidex 처리시 활성화
	@Override
	protected void attachBaseContext(Context base) {
		super.attachBaseContext(base);
		MultiDex.install(this);

	}
}
