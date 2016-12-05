//////////
//
//	Beeper
//
function Beeper(options) {
	return this.init(options || {});
}

Beeper.prototype = {

	init: function(options) {

        if (window.AudioContext) this.context = new window.AudioContext();
        else this.context = new window.webkitAudioContext();

		this.osc = this.context.createOscillator();
		this.osc.type = 'sine';
		this.osc.frequency.value = 880;

        this.gain = this.context.createGain();
        this.gain.gain.value = 0.1;

        this.osc.connect(this.gain);
        this.gain.connect(this.context.destination);

        this.osc.start(0);

        return this;
	},

	beep: function(frequency, duration, gain) {
        this.gain.gain.value = gain || 0.1;
        this.osc.frequency.value = frequency || 880;
        var self = this;
        window.setTimeout(function() { self.endBeep(); }, duration || 30);
	},

	endBeep: function() {
        this.gain.gain.value = 0;
	}
};

var beeper = new Beeper();
beeper.beep(440, 100, 0.25);

window.setTimeout(function() {
    beeper.beep(880, 100);
}, 1000);
