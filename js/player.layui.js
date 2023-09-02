function LayPlayer() {
	if (!window.Player)
		throw new Error('you need import player.js');
	if (!window.layui || !window.$)
		throw new Error('you need import layui.js and jquery.js');

	// 先把自己用变量储存起来,后面要用
	var myself = this, minew = {};

	var myPlayer = new Player();

	myself.init = function(options) {
		console.log('[options]', options);
		options = options || {};
		options.addFiles = addFiles;
		options.showSettings = showSettings;
		options.showDataList = showDataList;
		myPlayer.init(options);

		// 加一些值：
		minew.audioListId = '#lv-audio-list';
		minew.settingsId = '#lv-settings';

		console.log(myPlayer.elem);
		// 拷贝所有对外属性：
		var keys = Object.keys(myPlayer);
		$.each(keys, function(index, key) {
			if (myself.hasOwnProperty(key))
				return;
			myself[key] = myPlayer[key];
		});
		myPlayer.event = function(e) { // 先内部处理特殊部分，再给外面推:
			if (e.eventType == 'addFiles') {
				var list = myPlayer.playList, size = myself.listTempSize;
				myself.listTempSize = list ? list.length : 0;
				size = Number(size) - Number(myself.listTempSize);
				layer.close(myself.addFilesIndex);
				layer.success('成功添加' + list.length + '首歌曲！');
			}
			if (e.eventType == 'play' || e.eventType == 'next' || e.eventType == 'prev') {
				console.log('播放或暂停，渲染一下');
				if (!isNaN(myPlayer.nowPlay) && $(minew.audioListId).length > 0) {
					$(minew.audioListId).find('.selected').removeClass('selected');
					$(minew.audioListId).find('.lv-audio-item[data-row="' + myPlayer.nowPlay + '"]').addClass('selected');
				}
			}
			return myself.event(e);
		}

		// 添加事件：
		addEventListener();
	}

	// a.扩展：添加事件---------------------
	function addFiles(upfilesId) {
		upfilesId = upfilesId || myPlayer.upfilesId;
		var $elem = $('#' + upfilesId);
		if (!$elem.attr('data-layui')) {
			$elem.find('.text').html('<p>点击选择本地文件</p><p>（100M/首以内）</p><p>也可以将文件拖拽到页面添加</p>');
			$elem.find('input').click(function(e) {
				// 必须阻止冒泡事件，但必不能阻止默认事件！！！
				e.stopPropagation();
				// e.preventDefault();
			});
			$elem.click(function(e) {
				$elem.find('input').click();
			});
			$elem.attr('data-layui', 1);
		}
		var list = myPlayer.playList;
		myself.listTempSize = list ? list.length : 0;
		myself.addFilesIndex = layer.open({
			type: 1, // 必须是1，页面版
			title: '添加歌曲（可拖拽）',
			content: $elem,
			area: ['36%;min-width:120px', '36%;min-height:60px'],
			fixed: false, // 不固定
			maxmin: true,
			shade: 0.1,
			shadeClose: true,
			resize: false,
			scrollbar: false,
			btn: false
		});
	}

	// b.扩展：显示设置事件------------------
	function showSettings() {
		layer.close(minew.menusIndex || '-1');
		var html = [];
		html.push('<div class="lv-settings layui-form" id="lv-settings">');
		html.push('<div class="title">基础功能：</div>');
		html.push('<div class="lv-settings-item layui-form-item">');
		html.push('<button type="button" class="layui-btn layui-btn-normal layui-btn-sm" data-key="replay">重播</button>');
		html.push('<button type="button" class="layui-btn layui-btn-normal layui-btn-sm" data-key="download">下载</button>');
		html.push('<button type="button" class="layui-btn layui-btn-normal layui-btn-sm" data-key="reload">刷新页面</button>');
		html.push('<button type="button" class="layui-btn layui-btn-normal layui-btn-sm" data-key="clear">清空列表</button>');
		html.push('</div>');
		html.push('<div class="title">循环模式：</div>');
		html.push('<div class="lv-settings-item layui-form-item">');
		html.push('<div><input type="radio" name="xunhuan" value="0" lay-filter="lv-settings" ' + (myPlayer.loopMode == 0 ? 'checked' : '') + ' title="列表循环"></div>');
		html.push('<div><input type="radio" name="xunhuan" value="1" lay-filter="lv-settings" ' + (myPlayer.loopMode == 1 ? 'checked' : '') + ' title="顺序播放"></div>');
		html.push('<div><input type="radio" name="xunhuan" value="2" lay-filter="lv-settings" ' + (myPlayer.loopMode == 2 ? 'checked' : '') + ' title="单曲循环"></div>');
		html.push('<div><input type="radio" name="xunhuan" value="3" lay-filter="lv-settings" ' + (myPlayer.loopMode == 3 ? 'checked' : '') + ' title="随机播放"></div>');
		html.push('</div>');
		// 频谱效果,不设置或0为随机变化,1为条形柱状,2为环状声波,3 心电图效果
		html.push('<div class="title">频谱效果：</div>');
		html.push('<div class="lv-settings-item layui-form-item">');
		html.push('<div><input type="radio" name="qupu" value="0" lay-filter="lv-settings" ' + (myPlayer.effect == 0 ? 'checked' : '') + ' title="自动/随机"></div>');
		html.push('<div><input type="radio" name="qupu" value="1" lay-filter="lv-settings" ' + (myPlayer.effect == 1 ? 'checked' : '') + ' title="条形柱状"></div>');
		html.push('<div><input type="radio" name="qupu" value="2" lay-filter="lv-settings" ' + (myPlayer.effect == 2 ? 'checked' : '') + ' title="环状声波"></div>');
		html.push('<div><input type="radio" name="qupu" value="3" lay-filter="lv-settings" ' + (myPlayer.effect == 3 ? 'checked' : '') + ' title="心电图效果"></div>');
		html.push('</div>');
		html.push('');
		html.push('</div>');

		var $elem = $('<div style="position: fixed;width: 320px;height: auto;left:10px;z-index:-9999;">' + html.join('') + '</div>');
		$('body').append($elem);
		form.render('radio');
		var height = Math.max($elem.height(), 100) + 20;
		$elem.remove();
		minew.menusIndex = layer.tips(html.join(''), '#menus_settings', {
			tips: [1, '#fff'],
			time: 0,
			area: ['320px', height + 'px'],
			success: function(layero, index) {
				$('#layui-layer' + index).addClass('lv_menus_tips');

				var $elem = $(minew.settingsId);
				$elem.find('[data-key="replay"]').click(function() {
					return myPlayer.replay();
				});
				$elem.find('[data-key="download"]').click(function() {
					return downPlayFile();
				});
				$elem.find('[data-key="reload"]').click(function() {
					return window.location.reload(true);
				});
				$elem.find('[data-key="clear"]').click(function() {
					return myPlayer.clearList();
				});

				$elem.click(function(e) {
					if (e.stopPropagation)
						return e.stopPropagation() && false;
					if (e.preventDefault)
						return e.preventDefault() && false;
					window.event.cancelBubble = true;
					return false;
				});

				form.render('radio');
			}
		});

		form.on('radio(lv-settings)', function(data) {
			if (data.elem.name == 'xunhuan') {
				return myPlayer.loopMode = data.value;
			}
			if (data.elem.name == 'qupu') {
				if (myPlayer.analyser != null) {
					myPlayer.change({
						effect: parseInt(data.value)
					});
				}
				return;
			}
		});
	}

	function downPlayFile() {
		if (!myPlayer.audio.src)
			return alert('无数据！');
		var jdata = myPlayer.playList[myPlayer.nowPlay];
		var title = jdata ? jdata.title : (new Date().getTime() + '.mp3');

		var dlink = window.document.createElement("a");
		dlink.setAttribute('href', myPlayer.audio.src);
		dlink.setAttribute('download', title);
		dlink.style.display = 'none';
		myPlayer.elem.appendChild(dlink);
		dlink.click();
		dlink.parentNode.removeChild(dlink);
	}

	function fillstring(str) {
		return str && str.toString().length == 1 ? ("0" + str) : str;
	}

	// c.扩展：显示列表事件------------------
	function showDataList() {
		layer.close(minew.menusIndex || '-1');
		var html = [];
		html.push('<div class="lv-audio-list" id="lv-audio-list">');
		var list = myPlayer.getList() || [], isEmpty = list.length < 1;
		if (isEmpty)
			html.push('<div class="lv-empty"><center>暂无数据.</center></div>');
		for (var i = 0; i < list.length; i++) {
			var jdata = list[i] || {};
			var title = jdata.title || '', artist = jdata.artist || '';
			html.push('<div class="lv-audio-item ' + (i == myPlayer.nowPlay ? 'selected' : '') + '" data-row="' + i + '" title="点击播放：' + title + '(' + artist + ')">'
				+ fillstring(i + 1) + '. ' + title + '</div>');
		}
		html.push('</div>');

		var $elem = $('<div style="position: fixed;width: 320px;height: auto;left:10px;z-index:-9999;">' + html.join('') + '</div>');
		$('body').append($elem);
		form.render('radio');
		var height = Math.max($elem.height(), 100) + 20;
		$elem.remove();
		minew.menusIndex = layer.tips(html.join(''), '#menus_menu', {
			tips: [1, '#fff'],
			time: 0,
			area: ['320px', height + 'px'],
			success: function(layero, index) {
				$('#layui-layer' + index).addClass('lv_menus_tips');

				var $elem = $(minew.audioListId);
				$elem.click(function(e) {
					if (e.stopPropagation)
						return e.stopPropagation() && false;
					if (e.preventDefault)
						return e.preventDefault() && false;
					window.event.cancelBubble = true;
					return false;
				});
				if (isEmpty) {
					$elem.find('.lv-empty').click(function() {
						return addFiles();
					});
				} else {
					$elem.find('.lv-audio-item').click(function() {
						var row = $(this).attr('data-row');
						console.log('[点击了]', row);
						myPlayer.playByRow(row);
						layer.close(minew.menusIndex);
					});
				}
			}
		});
	}

	// e.更多：全局拖拽

	// f.事件：
	function addEventListener() {
		$(window).click(function(e) {
			var target = e.target;
			if (target.id == 'menus_settings' || target.id == 'menus_menu') {
				if (e.stopPropagation)
					return e.stopPropagation() && false;
				if (e.preventDefault)
					return e.preventDefault() && false;
				window.event.cancelBubble = true;
				return false;
			}
			layer.close(minew.menusIndex || '-1');
		});

		// 拖拽start
		var upcdisk = document.createElement("div"), upcdiskId = 'upcdisk';
		upcdisk.className = 'upcdisk-fixed none';
		upcdisk.id = upcdiskId;
		upcdisk.innerHTML = '<div class="layui-upload-drag"><i class="layui-icon layui-icon-upload-drag"></i><p>将文件拖拽到此处添加（100M/首以内）</p></div><div class="mask"></div>';
		window.document.getElementsByTagName("HTML")[0].appendChild(upcdisk);
		var myDrag = {
			elem: upcdisk,
			show: function(e) {
				e.stopPropagation();
				e.preventDefault();
				upcdisk.className = 'upcdisk-fixed';
			},
			hide: function(e) {
				e.stopPropagation();
				e.preventDefault();
				upcdisk.className = 'upcdisk-fixed none';
			},
			drop: function(e) {
				e.stopPropagation();
				e.preventDefault();
				var files = this.files || e.dataTransfer.files;
				if (!files || files.length < 1)
					return layer.error('没有文件！') || myDrag.hide(e);
				var list = [];
				$.each(files, function(index, file) {
					if (!file || !file.size || file.size < 1)
						return;
					if (!file.type || file.type.indexOf('audio') == -1)
						return;
					if (Math.round(file.size) > 100 * 1024 * 1024)
						return;
					var obj = {};
					obj.title = file.name;
					obj.artist = myPlayer.renderSize(file.size);
					obj.size = file.size;
					obj.mp3 = file;
					list.push(obj);
				});
				if (list.length < 1)
					return layer.error('没有文件！') || myDrag.hide(e);
				myPlayer.appendList(list);
				// audio;
				console.log(files);
				myDrag.hide(e);
				return layer.success('成功添加' + list.length + '首歌曲！');
			}
		}

		$(window).on('dragenter', function(e) { // 开始拖到window
			myDrag.show(e);
		});
		upcdisk.addEventListener('dragenter', myDrag.show);
		upcdisk.addEventListener('dragover', myDrag.show);
		upcdisk.addEventListener('dragleave', myDrag.hide);
		upcdisk.addEventListener('drop', myDrag.drop);
		// 拖拽end

		var style = [];
		style.push('.none { display: none !important; }');
		style.push('.upcdisk-fixed{position: fixed;top: 0;bottom: 0;left: 0;right: 0;z-index: 19950115;text-align: center;}');
		style.push('.upcdisk-fixed .layui-upload-drag{width: 280px;height: auto;z-index: 19950116;border: 0;margin: 0 auto;margin-top: 30%;}');
		style.push('.upcdisk-fixed .mask{position: absolute;top: 0;bottom: 0;left: 0;right: 0;background: white;z-index: 19950115;opacity: 0.8;}');
		style.push('.upcdisk-fixed *{pointer-events: none;}');
		style.push('.upcdisk{text-align: center;}');
		style.push('.layui-layer-content .lv-upfiles{ position: absolute; top: 0; bottom: 0; left: 0; right: 0; cursor: pointer; text-align: center;}');
		style.push('.layui-layer-content .lv-upfiles input{display: none !important;}');
		style.push('.layui-layer-content .lv-upfiles .center{margin:10% auto;color:#aaa;}');
		//
		style.push('.lv_menus_tips{}');
		style.push('.lv_menus_tips.layui-layer-tips .layui-layer-content{padding:0;}');
		style.push('.lv_menus_tips .lv-settings .lv-settings-item{color: #000;}');
		style.push('.lv_menus_tips i.layui-layer-TipsT{border-right-color: #fff !important;}');
		style.push('.lv_menus_tips .lv-settings .layui-form-item{margin-bottom:0;}');
		$("head").append('<style type="text/css" id="player_layui_css">' + style.join('') + '</style>');
	}
}