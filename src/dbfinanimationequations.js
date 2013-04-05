/* -*- mode: js2; js2-basic-offset: 4; c-basic-offset: 4; tab-width: 4; indent-tabs-mode: nil -*-  */
/*
 * YAWL (Yet Another Window List) Gnome-Shell Extension
 * Copyright (C) 2013 Vadim @ dbFin <vadim@dbfin.com>
 * You should have received a copy of the License along with this program.
 *
 * dbfinanimationequations.js
 * Custom animation equations.
 *
 */

const ExtensionUtils = imports.misc.extensionUtils;
const Me = ExtensionUtils.getCurrentExtension();

const dnFinConsts = Me.imports.dbfinconsts;
const dbFinUtils = Me.imports.dbfinutils;

/* In all functions below the following are the parameters:
 * 		t		current time (from 0 to d)
 *		b		initial value
 * 		c		expected change in value
 * 		d		expected duration
 * 		p		parameters (if needed)
 */

//function (t, b, c, d, p) {
//}

/* delay:	animate the given animation transition after delay
 */
function delay(transition, delay/* = 0.5*/) {
	if (!transition) return (function () {});
    delay = dbFinUtils.inRange(parseFloat(delay), 0.0, 1.0, 0.5);
	if (!isNaN(parseInt(transition))) {
        transition = dbFinConsts.arrayAnimationTransitions[
            dbFinUtils.inRange(parseInt(transition),
            0, dbFinConsts.arrayAnimationTransitions.length - 1, 0)
        ][1];
	}
	if (typeof transition == 'string') {
		if (typeof imports.tweener.equations[transition] == 'function') {
			transition = imports.tweener.equations[transition];
		}
		else if (typeof Me.imports.dbfinanimationequations[transition] == 'function') {
			transition = Me.imports.dbfinanimationequations[transition];
		}
	}
    if (typeof transition == 'function') {
        if (delay == 0.0) return transition;
        else if (delay < 1.0) return (function (t, b, c, d, p) {
			if ((t = (t - d * delay) / (1.0 - delay)) < 0) return b;
			else return transition(t, b, c, d, p);
        });
        else return (function (t, b, c, d, p) {
			if (t < d) return b;
			else return b + c; // it is assumed that all transitions come to b+c
        });
    }
    else {
        return (function () {});
    }
}
