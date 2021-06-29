class Counter {
    constructor() {
        this.count = 0;
    }

    add(n = 1) {
        this.count += n;
        return this.count;
    }

    set(n = 0) {
        this.count = n;
        return this.count;
    }
}

exports.Counter = Counter;
