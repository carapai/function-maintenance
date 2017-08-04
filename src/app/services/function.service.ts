import { Injectable } from '@angular/core';
import {HttpClientService} from "./http-client.service";
import {Observable} from 'rxjs/Rx';
import {FunctionObject} from "../models/function-object";
import {User} from "../models/user";
import {FunctionParameters} from "../models/function-parameters";

@Injectable()
export class FunctionService {

  constructor(private http:HttpClientService) { }

  currentUser;
  getCurrentUser(){
    return new Observable((observable)=>{
      if(this.currentUser){
        observable.next(this.currentUser);
        observable.complete();
      }else{
        this.http.get("me").subscribe((results)=>{
          this.currentUser = results;
          observable.next(this.currentUser);
          observable.complete();
        })
      }
    })
  }
  save(sFunction:FunctionObject){
    return new Observable((observable)=>{
      if(sFunction.id){
        sFunction.lastUpdated = new Date();
        sFunction.displayName = sFunction.name;
        this.http.put("dataStore/functions/" + sFunction.id,sFunction).subscribe((results)=>{
          observable.next(sFunction);
          observable.complete();
        })
      }else{
        this.http.get("system/id").subscribe((results:any)=>{
          sFunction.id = results.codes[0];
          sFunction.created = new Date();
          sFunction.lastUpdated = new Date();
          sFunction.externalAccess = false;
          sFunction.userGroupAccesses = [];
          sFunction.attributeValues = [];
          sFunction.translations = [];
          sFunction.userAccesses = [];
          sFunction.publicAccess = "rw------";

          this.getCurrentUser().subscribe((user:User)=>{
            sFunction.user = {
              id:user.id
            };
            this.http.get("system/info").subscribe((results:any)=>{
              sFunction.href = results.contextPath +"?api/dataStore/functions/" + sFunction.id;
              this.http.post("dataStore/functions/" + sFunction.id,sFunction).subscribe((results)=>{
                observable.next(sFunction);
                observable.complete();
              })
            })
          })
        })
      }
    })

  }
  getAll(){
    return new Observable((observ)=>{
      this.http.get("dataStore/functions").subscribe((results)=>{
        let observable = [];
        results.forEach((id)=>{
          observable.push(this.http.get("dataStore/functions/" + id))
        });
        Observable.forkJoin(observable).subscribe((responses:any)=>{
          let functions = [];
          responses.forEach((response,index)=>{
            functions.push(response);
          })
          observ.next(functions);
          observ.complete();
        },(error)=>{

        })
      },(error)=>{

      })
    })

  }
  get(id){
    return new Observable((observ)=>{
      console.log("Function:",id)
      this.http.get("dataStore/functions/" + id).subscribe((func)=>{
        observ.next(func);
        observ.complete();
      },(error)=>{

      })
    })

  }
  run(functionParameters:FunctionParameters,functionObject:FunctionObject){
    return new Observable((observ)=>{
      if(!this.isError(functionObject.function)){
        try{
          functionParameters.error =(error)=>{
            observ.error(error);
            observ.complete();
          }
          functionParameters.success =(results)=>{
            observ.next(results);
            observ.complete();
          }
          functionParameters.progress =(results)=>{

          }
          let execute = Function('parameters', functionObject.function);
          execute(functionParameters);
        }catch(e){
          observ.error(e.stack);
          observ.complete();
        }
      }else{
        observ.error({message:"Errors in the code."});
        observ.complete();
      }
    });
  }
  isError(code){
    var successError = false;
    var errorError = false;
    var progressError = false;
    let value = code.split(" ").join("").split("\n").join("").split("\t").join("");
    if(value.indexOf("parameters.success(") == -1){
      successError = true;
    }
    if(value.indexOf("parameters.error(") == -1){
      errorError = true;
    }
    if(value.indexOf("parameters.progress(") == -1){
      progressError = true;
    }
    return successError || errorError;
  }

}
