import { v4 as uuidv4 } from "uuid";
class EventEmiter {
    //eventCallback  区块获取
    //pendingEventCallback pending区块获取
    //smartCallBack smartswap打出订单event回调
    callbacks = new Map()
    subscribe(method: string, callback: any, params?:any) {
        let uuid = uuidv4()
        if (this.callbacks.get(method)) {
            let methods = this.callbacks.get(method)
            let obj = {
                callback:callback,
                params:params
            }
            methods[uuid] = obj
            this.callbacks.set(method, methods)
        } else {
            let methods = {}
            let obj = {
                callback:callback,
                params:params
            }
            methods[uuid] = obj
            this.callbacks.set(method, methods)
        }
        return {
            remove: () => {
                let methods = this.callbacks.get(method)
                delete methods[uuid]
                this.callbacks.set(method, methods)
            }
        }
    }
    emit(method:string, params: any){
        if(this.callbacks.get(method)){
            let methods = this.callbacks.get(method)
            for(let key in methods){
                let func = methods[key]
                func.callback(params, func.params)
            }
        }
    }
}

export default EventEmiter