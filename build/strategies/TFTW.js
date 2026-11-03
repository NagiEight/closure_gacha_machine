var __esDecorate = (this && this.__esDecorate) || function (ctor, descriptorIn, decorators, contextIn, initializers, extraInitializers) {
    function accept(f) { if (f !== void 0 && typeof f !== "function") throw new TypeError("Function expected"); return f; }
    var kind = contextIn.kind, key = kind === "getter" ? "get" : kind === "setter" ? "set" : "value";
    var target = !descriptorIn && ctor ? contextIn["static"] ? ctor : ctor.prototype : null;
    var descriptor = descriptorIn || (target ? Object.getOwnPropertyDescriptor(target, contextIn.name) : {});
    var _, done = false;
    for (var i = decorators.length - 1; i >= 0; i--) {
        var context = {};
        for (var p in contextIn) context[p] = p === "access" ? {} : contextIn[p];
        for (var p in contextIn.access) context.access[p] = contextIn.access[p];
        context.addInitializer = function (f) { if (done) throw new TypeError("Cannot add initializers after decoration has completed"); extraInitializers.push(accept(f || null)); };
        var result = (0, decorators[i])(kind === "accessor" ? { get: descriptor.get, set: descriptor.set } : descriptor[key], context);
        if (kind === "accessor") {
            if (result === void 0) continue;
            if (result === null || typeof result !== "object") throw new TypeError("Object expected");
            if (_ = accept(result.get)) descriptor.get = _;
            if (_ = accept(result.set)) descriptor.set = _;
            if (_ = accept(result.init)) initializers.unshift(_);
        }
        else if (_ = accept(result)) {
            if (kind === "field") initializers.unshift(_);
            else descriptor[key] = _;
        }
    }
    if (target) Object.defineProperty(target, contextIn.name, descriptor);
    done = true;
};
var __runInitializers = (this && this.__runInitializers) || function (thisArg, initializers, value) {
    var useValue = arguments.length > 2;
    for (var i = 0; i < initializers.length; i++) {
        value = useValue ? initializers[i].call(thisArg, value) : initializers[i].call(thisArg);
    }
    return useValue ? value : void 0;
};
import GenericFiveStarsHandler from "#helpers/GenericFiveStarsHandler";
import GenericFourStarsHandler from "#helpers/GenericFourStarsHandler";
import RandomItem from "#helpers/RandomItem";
import Switch from "#helpers/Switch";
import StrategyManager from "#StrategyManager";
import BannerTypes from "#types/BannerTypes";
import Items from "#types/Items";
import RateUp from "#types/RateUp";
let JointOperation = (() => {
    let _classDecorators = [StrategyManager.Register(BannerTypes.TFTW)];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    var JointOperation = class {
        static { _classThis = this; }
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
            __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
            JointOperation = _classThis = _classDescriptor.value;
            if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
            __runInitializers(_classThis, _classExtraInitializers);
        }
        RateUp = {
            [Items.FiveStars]: [
                { Value: RateUp.Primary, Chance: 60 },
                { Value: RateUp.None, Chance: 40 }
            ],
            [Items.FourStars]: [
                { Value: RateUp.Primary, Chance: 45 },
                { Value: RateUp.None, Chance: 55 }
            ]
        };
        Roll(Banner, Result, RU) {
            return Switch(Result, {
                [Items.SixStars]: () => RandomItem(Banner.SixStarsPool.Primary),
                [Items.FiveStars]: () => GenericFiveStarsHandler(Banner, RU),
                [Items.FourStars]: () => GenericFourStarsHandler(Banner, RU),
                [Items.ThreeStars]: () => RandomItem(Banner.ThreeStarsPool)
            });
        }
    };
    return JointOperation = _classThis;
})();
export default JointOperation;
