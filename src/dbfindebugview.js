/* -*- mode: js2; js2-basic-offset: 4; c-basic-offset: 4; tab-width: 4; indent-tabs-mode: nil -*-  */
/*
 * YAWL (Yet Another Window List) Gnome-Shell Extension
 * Copyright (C) 2013 Vadim @ dbFin <vadim@dbfin.com>
 * You should have received a copy of the License along with this program.
 *
 * dbfindebugview.js
 * View debug messages.
 *
 */

const Lang = imports.lang;

const St = imports.gi.St;

const ExtensionSystem = imports.ui.extensionSystem;
const Main = imports.ui.main;

const ExtensionUtils = imports.misc.extensionUtils;
const Me = ExtensionUtils.getCurrentExtension();

const dbFinSignals = Me.imports.dbfinsignals;
const dbFinUtils = Me.imports.dbfinutils;

const Gettext = imports.gettext.domain(Me.metadata['gettext-domain']);
const _ = Gettext.gettext;

const _D = Me.imports.dbfindebug._D;

const dbFinDebugView = new Lang.Class({
	Name: 'dbFin.DebugView',

	_init: function() {
		_D('@');
        this._signals = new dbFinSignals.dbFinSignals();
		this.hovered = false;
		this.pinned = false;
		this.paused = false;

		this.container = new St.BoxLayout({ name: 'dbFinDebugView', vertical: true, reactive: true, visible: true });
		if (this.container) {
			if (Main.layoutManager) Main.layoutManager.addChrome(this.container);
			this.updatePosition();
		}

		this.toolbar = new St.BoxLayout({ name: 'dbFinDebugViewToolbar', vertical: false, reactive: true, visible: true });
		if (this.toolbar) {
			if (this.container) this.container.add_actor(this.toolbar);

			this.buttonPin = new St.Label({ name: 'dbFinDebugViewButtonPin', style_class: 'dbfin-debugview-toolbar-button',
											text: '[ ]', reactive: true, track_hover: true, visible: true });
			if (this.buttonPin) this.toolbar.add_actor(this.buttonPin);

			this.buttonPause = new St.Label({ name: 'dbFinDebugViewButtonPause', style_class: 'dbfin-debugview-toolbar-button',
											  text: '[\u25fe]', reactive: true, track_hover: true, visible: true });
			if (this.buttonPause) this.toolbar.add_actor(this.buttonPause);

			this.buttonClear = new St.Label({ name: 'dbFinDebugViewButtonClear', style_class: 'dbfin-debugview-toolbar-button',
											  text: 'Clear', reactive: true, track_hover: true, visible: true });
			if (this.buttonClear) this.toolbar.add_actor(this.buttonClear);

			this.buttonReload = new St.Label({ name: 'dbFinDebugViewButtonReload', style_class: 'dbfin-debugview-toolbar-button',
											   text: 'Reload', reactive: true, track_hover: true, visible: true });
			if (this.buttonReload) this.toolbar.add_actor(this.buttonReload);
		}

		this.scrollView = new St.ScrollView({ name: 'dbFinDebugViewScrollView', reactive: true, visible: true });
		if (this.scrollView) {
			if (this.container) this.container.add_actor(this.scrollView);
		}

		this.level0 = null;
		this.clear();

		if (Main.overview && Main.overview.visible) this.hide();

		this._signals.connectNoId({	emitter: Main.layoutManager, signal: 'monitors-changed',
									callback: this.updatePosition, scope: this });
		this._signals.connectNoId({	emitter: Main.overview, signal: 'showing',
									callback: this.hide, scope: this });
		this._signals.connectNoId({	emitter: Main.overview, signal: 'hiding',
									callback: this.show, scope: this });
		this._signals.connectNoId({ emitter: this.container, signal: 'enter-event',
									callback: function () { this.hovered = true; this.updatePosition(); }, scope: this });
		this._signals.connectNoId({ emitter: this.container, signal: 'leave-event',
									callback: function () { this.hovered = false; this.updatePosition(); }, scope: this });
		this._signals.connectNoId({	emitter: this.buttonPin, signal: 'button-press-event',
									callback: this._buttonPinButtonPressEvent, scope: this });
		this._signals.connectNoId({	emitter: this.buttonPause, signal: 'button-press-event',
									callback: this._buttonPauseButtonPressEvent, scope: this });
		this._signals.connectNoId({	emitter: this.buttonClear, signal: 'button-press-event',
									callback: this._buttonClearButtonPressEvent, scope: this });
		this._signals.connectNoId({	emitter: this.buttonReload, signal: 'button-press-event',
									callback: this._buttonReloadButtonPressEvent, scope: this });
		_D('<');
	},

	destroy: function() {
		_D('@');
        if (this._signals) {
            this._signals.destroy();
            this._signals = null;
        }
		this._level0 = null;
		this._level1 = null;
		this._level2 = null;
		if (this.container) {
			if (Main.layoutManager) Main.layoutManager.removeChrome(this.container);
			this.container.destroy();
			this.container = null;
		}
		this.toolbar = null;
		this.buttonPin = null;
		this.buttonPause = null;
		this.buttonClear = null;
		this.buttonReload = null;
		this.scrollView = null;
		this.actor = null;
		this.hovered = false;
		_D('<');
	},

	updatePosition: function() {
		_D('@');
		if (this.container && this.container.get_stage()) {
			let (monitor =	Main.layoutManager && Main.layoutManager.monitors && Main.layoutManager.monitors.length
							&& Main.layoutManager.monitors[global.yawl && global.yawl._debugBottom
							                               ? 0
							                               : Main.layoutManager.monitors.length - 1]) {
				if (monitor) {
					let (width =	Math.round(monitor.width
					                        * dbFinUtils.inRange(global.yawl && global.yawl._debugWidth, 0, 100, 50)
					                        / 100.)
					     			+ (global.yawl && global.yawl._debugBottom ? 0 : 14),
					     height = monitor.height - (global.yawl && global.yawl._debugBottom ? 21 : 64)) {
						let (x = monitor.x + (global.yawl && global.yawl._debugBottom
						                      ? 11 : monitor.width - (this.hovered || this.pinned ? width - 14 : 8)),
						     y = monitor.y + (global.yawl && global.yawl._debugBottom
						                      ? (this.hovered || this.pinned ? 32 : monitor.height - 8) : 32)) {
							if (this.container.width !== width) this.container.width = width;
							if (this.container.height !== height) this.container.height = height;
							if (this.container.x !== x) this.container.x = x;
							if (this.container.y !== y) this.container.y = y;
						} // let (x, y)
					} // let (width, height)
				} // if (monitor)
			} // let (monitor)
		} // if (this.container && this.container.get_stage())
		_D('<');
	},

	show: function() {
		if (this.container) this.container.show();
	},

	hide: function() {
		if (this.container) this.container.hide();
	},

	_open: function(label) {
		if (label && label._box) {
			label._box.visible = true;
			label.set_text('-' + label.get_text().substring(1))
		}
	},

	_close: function(label) {
		if (label && label._box) {
			label._box.visible = false;
			label.set_text('+' + label.get_text().substring(1))
		}
	},

	_toggle: function(label) {
		if (label && label._box) {
			if (label._box.visible) this._close(label);
			else this._open(label);
		}
	},

	clear: function() {
		if (this.level0) {
			if (this.scrollView) this.scrollView.remove_actor(this.level0);
			this.level0.destroy();
			this.level0 = null;
		}
		this.level0 = new St.BoxLayout({ vertical: true, reactive: true, visible: true });
		if (this.level0) {
			if (this.scrollView) this.scrollView.add_actor(this.level0);
		}
		this._level1 = null;
		this._level2 = null;
	},

	_labelButtonPressEvent: function(label, event) {
		if (!event) return;
		let (button = event.get_button()) {
			if (button == 1) this._toggle(label);
		}
	},

	_buttonPinButtonPressEvent: function(label, event) {
		if (!event) return;
		let (button = event.get_button()) {
			if (button == 1) {
				this.pinned = !this.pinned;
				this.updatePosition();
				if (this.buttonPin) {
					if (this.pinned) this.buttonPin.set_text('[\u00b7]');
					else this.buttonPin.set_text('[ ]');
				}
			}
		}
	},

	_buttonPauseButtonPressEvent: function(label, event) {
		if (!event) return;
		let (button = event.get_button()) {
			if (button == 1) {
				this.paused = !this.paused;
				if (this.buttonPause) {
					if (this.paused) this.buttonPause.set_text('[\u25b8]');
					else this.buttonPause.set_text('[\u25fe]');
				}
			}
		}
	},

	_buttonClearButtonPressEvent: function(label, event) {
		if (!event) return;
		let (button = event.get_button()) {
			if (button == 1) this.clear();
		}
	},

	_buttonReloadButtonPressEvent: function(label, event) {
		if (!event) return;
		let (button = event.get_button()) {
			if (button == 1) ExtensionSystem.reloadExtension(Me);
		}
	},

	log: function(level, text) {
		_D('@');
		if (this.paused || !this.level0) {
			_D('<');
			return;
		}
		let (label = null,
		     box = null,
		     container = null) {
			if (level > 1) {
				if (!this._level2) {
					this.log(1, '???');
					if (!this._level2) { _D('<'); return; }
					this.log(2, '...');
				}
				text = dbFinUtils.stringRepeat('    ', level - 2) + text;
				if (this._level2._labelChild) {
					this._level2._labelText += '\n' + text;
					this._level2._labelChild.set_text(this._level2._labelText);
				}
				else {
					this._level2._labelText = text;
					label = new St.Label({ name: 'dbFinDebugViewBox2', text: this._level2._labelText, reactive: true, visible: true });
					this._level2._labelChild = label;
				}
				container = this._level2;
			}
			else if (!level) {
				label = new St.Label({ text: ' ' + text, reactive: true, visible: true });
				box = new St.BoxLayout({ name: 'dbFinDebugViewBox', vertical: true, reactive: true, visible: false });
				container = this.level0;
				this._level1 = box;
				this._level2 = null;
			}
			else {
				if (!this._level1) {
					this.log(0, '???');
					if (!this._level1) { _D('<'); return; }
					this.log(1, '...');
				}
				label = new St.Label({ text: ' ' + text, reactive: true, visible: true });
				box = new St.BoxLayout({ name: 'dbFinDebugViewBox', vertical: true, reactive: true, visible: false });
				container = this._level1;
				this._level2 = box;
			}
			if (label && box) {
				label._box = box;
				box._label = label;
			}
			if (container && (label || box)) {
				if (!container.get_n_children()) {
					if (container._label) {
						container._label.set_text('+' + container._label.get_text().substring(1));
						if (level == 1) this._open(container._label);
						this._signals.connectNoId({	emitter: container._label, signal: 'button-press-event',
			 										callback: this._labelButtonPressEvent, scope: this });
					}
				}
				if (label) container.add_actor(label);
				if (box) container.add_actor(box);
			}
		} // let (label, box, container)
		_D('<');
	}
});