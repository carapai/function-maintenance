import { Injectable } from '@angular/core';
import {HttpClientService} from "./http-client.service";
import {Observable} from 'rxjs/Rx';
import {FunctionObject} from "../models/function-object";
import {User} from "../models/user";
import {FunctionParameters} from "../models/function-parameters";
import {UserService} from "./user.service";

@Injectable()
export class FunctionService {

  constructor(private http:HttpClientService,private userService:UserService) { }


  save(sFunction:FunctionObject){
    return new Observable((observable)=>{
      if(sFunction.id){
        sFunction.lastUpdated = new Date();
        sFunction.displayName = sFunction.name;
        this.http.put("dataStore/functions/" + sFunction.id,sFunction).subscribe((results)=>{
          observable.next(sFunction);
          observable.complete();
        },(error)=>{
          observable.error(error.json());
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

          this.userService.getCurrentUser().subscribe((user:User)=>{
            sFunction.user = {
              id:user.id
            };
            this.http.get("system/info").subscribe((results:any)=>{
              sFunction.href = results.contextPath +"?api/dataStore/functions/" + sFunction.id;
              this.http.post("dataStore/functions/" + sFunction.id,sFunction).subscribe((results)=>{
                observable.next(sFunction);
                observable.complete();
              },(error)=>{
                observable.error(error.json());
                observable.complete();
              })
            },(error)=>{
              observable.error(error.json());
              observable.complete();
            })
          })
        })
      }
    })

  }
  getId(number?){
    let url = "system/id";
    if(number){
      url += ".json?limit=" + number;
    }
    return this.http.get(url);
  }
  delete(sFunction:FunctionObject){
    return new Observable((observable)=>{

      this.http.delete("dataStore/functions/" + sFunction.id).subscribe((results)=>{
        observable.next(results);
        observable.complete();
      },(error)=>{
       observable.error(error.json());
       observable.complete();
      })
    })

  }
  apiVersion = ""
  getAll(){
    return new Observable((observ)=>{
      this.http.get("dataStore/functions").subscribe((results)=>{
        let observable = [];
        if(results.length > 0){
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
            observ.error(error.json());
            observ.complete();
          })
        }else{
          this.http.get("system/info").subscribe((response)=>{
            if(parseFloat(response.version) > 2.24){
              this.apiVersion = "/24"
            }
            Observable.forkJoin(this.creationOfNewFunctionObseravble()).subscribe((responses:any)=>{
              this.getAll().subscribe((funcs)=>{
                observ.next(funcs);
                observ.complete();
              },(error)=>{
                observ.error(error);
                observ.complete();
              })
            },(error)=>{
              observ.error(error.json());
              observ.complete();
            })
          })
        }
      },(error)=>{
        let foundError = error.json();
        if(foundError.httpStatusCode == 404){
          let observable = [];
          this.http.get("system/info").subscribe((response)=>{
            if(parseFloat(response.version) > 2.24){
              this.apiVersion = "/24"
            }
            Observable.forkJoin(this.creationOfNewFunctionObseravble()).subscribe((responses:any)=>{
              this.getAll().subscribe((funcs)=>{
                observ.next(funcs);
                observ.complete();
              },(error)=>{
                observ.error(error);
                observ.complete();
              })
            },(error)=>{
              observ.error(error.json());
              observ.complete();
            })
          })
        }else{
          observ.error(error.json());
          observ.complete();
        }
      })
    })

  }
  creationOfNewFunctionObseravble(){
    let observable = [];
    observable.push(this.createCompletenessFunctions());
    observable.push(this.createEarlyCompletenessFunctions());
    observable.push(this.createReportingRateByFilledData());
    observable.push(this.proportionOfOrgUnitsNotReport());
    observable.push(this.orgUnitsReportedOnDataSet());
    return observable;
  }
  createStockOutFunctions(){
    return new Observable((observable)=>{
      let stockout:any = {
        "function": "//Example of function implementation\nparameters.progress(50);\nfunction calculatePercentageForOU(ou){\n    return new Promise(function(resolve,reject){\n      $.ajax({\n                    \turl: \"../../../api" +this.apiVersion+ "/analytics.json?dimension=dx:\" + parameters.rule.json.data + \"&dimension=pe:\" + parameters.pe + \"&dimension=ou:LEVEL-4;\" + ou + \"&hierarchyMeta=true\",\n                    \ttype: \"GET\",\n                    \tsuccess: function(analyticsResults) {\n                    \t    var orgUnits = [];\n                    \t    analyticsResults.rows.forEach(function(row){\n                    \t        var orgUnitId = row[1] + '.' + row[2]\n                    \t        if(orgUnits.indexOf(orgUnitId) == -1){\n                    \t            orgUnits.push(orgUnitId);\n                    \t        }\n                    \t    })\n                    \t    analyticsResults.metaData.dx = [parameters.rule.id];\n                    \t    analyticsResults.metaData.names[parameters.rule.id] = parameters.rule.name;\n                    \t    analyticsResults.rows = [];\n                    \t    analyticsResults.metaData.pe.forEach(function(pe){\n                    \t        var currentPeOrgUnits = [];\n                    \t        orgUnits.forEach(function(orgUnit) {\n                    \t            if (orgUnit.split('.')[0] === pe) {\n                    \t               currentPeOrgUnits.push(orgUnit)\n                    \t            }\n                    \t        });\n                    \t        \n                    \t        if (currentPeOrgUnits.length > 0) {\n                    \t            analyticsResults.rows.push([parameters.rule.id,pe,ou,\"\" + (currentPeOrgUnits.length * 100 / analyticsResults.metaData.ou.length).toFixed(2)])\n                    \t        }\n                    \t    });\n                    \t\tanalyticsResults.metaData.ou = [ou];\n                    \t\tresolve(analyticsResults);\n                    \t},\n                    \terror:function(error){\n                    \t\t  reject(error);\n                    \t}\n                    });  \n    })\n}\n$.ajax({\n    url: \"../../../api" +this.apiVersion+ "/analytics.json?dimension=pe:\" + parameters.pe + \"&dimension=ou:\" + parameters.ou + \"&skipData=true\",\n    type: \"GET\",\n    success: function(dummyAnalyticsResults) {\n        var promises = [];\n        var analytics;\n        dummyAnalyticsResults.metaData.ou.forEach(function(ou){\n            promises.push(calculatePercentageForOU(ou).then(function(analyticsResults){\n                if(!analytics){\n                    analytics = analyticsResults;\n                }else{\n                   analytics.metaData.ou = analytics.metaData.ou.concat(analyticsResults.metaData.ou);\n                   analyticsResults.metaData.ou.forEach(function(ouid){\n                       analytics.metaData.names[ouid] = analyticsResults.metaData.names[ouid];\n                   })\n                    analytics.rows = analytics.rows.concat(analyticsResults.rows);\n                }\n            }));\n        })\n        \n        Promise.all(promises).then(function(){\n            parameters.success(analytics);\n        },function(error){\n            parameters.error(error);\n        })\n},error:function(error){\n    reject(error);\n}\n});",
        "rules": [
        ],
        "name": "Facilities With Stockout",
        "description": "Number of facilities with stockout"
      };
      this.http.get("dataElements.json?filter=name:ilike:stockout&filter=valueType:eq:BOOLEAN&rootJunction=OR&paging=false").subscribe((dataElementResults)=>{
        if(dataElementResults.dataElements.length == 0){
          //TODO add a provision if the dhis server has no stockout data elements
        }else{
          this.getId(dataElementResults.dataElements.length).subscribe((codeResults)=>{
            dataElementResults.dataElements.forEach((dataElement)=>{
              if(dataElement.displayName.toLowerCase().indexOf("stockout") >= -1){
                let rule:any = {
                  id: codeResults.codes[0],
                  name: dataElement.displayName,
                  description: "This is the rule. Using the data set '" + dataElement.displayName+ "'.",
                  json: {"data": dataElement.id}
                }
                if(stockout.rules.length == 0){
                  rule.isDefault = true;
                }
                stockout.rules.push(rule);
              }
            })
            if(stockout.rules.length == 0){
              stockout.rules.push({
                id: codeResults.codes[0],
                name: dataElementResults.dataElements[0].displayName,
                isDefault:true,
                description: "This is the rule. Using the data element '" + dataElementResults.dataElements[0].displayName+ "'.",
                json: {"data": dataElementResults.dataElements[0].id}
              });
            }
            this.save(stockout).subscribe((res)=>{
              observable.next(res);
              observable.complete();
            },(error)=>{
              observable.error(error.json());
              observable.complete();
            })
          },(error)=>{
            observable.error(error.json());
            observable.complete();
          })
        }

      },(error)=>{
        observable.error(error.json());
        observable.complete();
      })
    })
  }
  createPredictors(){
    return new Observable((observable)=>{
      let stockout:any = {
        "function": "//Example of function implementation\nparameters.progress(50);\nfunction calculatePercentageForOU(ou){\n    return new Promise(function(resolve,reject){\n      $.ajax({\n                    \turl: \"../../../api" +this.apiVersion+ "/analytics.json?dimension=dx:\" + parameters.rule.json.data + \"&dimension=pe:\" + parameters.pe + \"&dimension=ou:LEVEL-4;\" + ou + \"&hierarchyMeta=true\",\n                    \ttype: \"GET\",\n                    \tsuccess: function(analyticsResults) {\n                    \t    var orgUnits = [];\n                    \t    analyticsResults.rows.forEach(function(row){\n                    \t        var orgUnitId = row[1] + '.' + row[2]\n                    \t        if(orgUnits.indexOf(orgUnitId) == -1){\n                    \t            orgUnits.push(orgUnitId);\n                    \t        }\n                    \t    })\n                    \t    analyticsResults.metaData.dx = [parameters.rule.id];\n                    \t    analyticsResults.metaData.names[parameters.rule.id] = parameters.rule.name;\n                    \t    analyticsResults.rows = [];\n                    \t    analyticsResults.metaData.pe.forEach(function(pe){\n                    \t        var currentPeOrgUnits = [];\n                    \t        orgUnits.forEach(function(orgUnit) {\n                    \t            if (orgUnit.split('.')[0] === pe) {\n                    \t               currentPeOrgUnits.push(orgUnit)\n                    \t            }\n                    \t        });\n                    \t        \n                    \t        if (currentPeOrgUnits.length > 0) {\n                    \t            analyticsResults.rows.push([parameters.rule.id,pe,ou,\"\" + (currentPeOrgUnits.length * 100 / analyticsResults.metaData.ou.length).toFixed(2)])\n                    \t        }\n                    \t    });\n                    \t\tanalyticsResults.metaData.ou = [ou];\n                    \t\tresolve(analyticsResults);\n                    \t},\n                    \terror:function(error){\n                    \t\t  reject(error);\n                    \t}\n                    });  \n    })\n}\n$.ajax({\n    url: \"../../../api" +this.apiVersion+ "/analytics.json?dimension=pe:\" + parameters.pe + \"&dimension=ou:\" + parameters.ou + \"&skipData=true\",\n    type: \"GET\",\n    success: function(dummyAnalyticsResults) {\n        var promises = [];\n        var analytics;\n        dummyAnalyticsResults.metaData.ou.forEach(function(ou){\n            promises.push(calculatePercentageForOU(ou).then(function(analyticsResults){\n                if(!analytics){\n                    analytics = analyticsResults;\n                }else{\n                   analytics.metaData.ou = analytics.metaData.ou.concat(analyticsResults.metaData.ou);\n                   analyticsResults.metaData.ou.forEach(function(ouid){\n                       analytics.metaData.names[ouid] = analyticsResults.metaData.names[ouid];\n                   })\n                    analytics.rows = analytics.rows.concat(analyticsResults.rows);\n                }\n            }));\n        })\n        \n        Promise.all(promises).then(function(){\n            parameters.success(analytics);\n        },function(error){\n            parameters.error(error);\n        })\n},error:function(error){\n    reject(error);\n}\n});",
        "rules": [
        ],
        "name": "Facilities With Stockout",
        "description": "Number of facilities with stockout"
      };
      this.http.get("dataElements.json?filter=name:ilike:stockout&filter=valueType:eq:BOOLEAN&rootJunction=OR&paging=false").subscribe((dataElementResults)=>{
        if(dataElementResults.dataElements.length == 0){
          //TODO add a provision if the dhis server has no stockout data elements
        }else{
          this.getId(dataElementResults.dataElements.length).subscribe((codeResults)=>{
            dataElementResults.dataElements.forEach((dataElement)=>{
              if(dataElement.displayName.toLowerCase().indexOf("stockout") >= -1){
                let rule:any = {
                  id: codeResults.codes[0],
                  name: dataElement.displayName,
                  description: "This is the rule. Using the data set '" + dataElement.displayName+ "'.",
                  json: {"data": dataElement.id}
                }
                if(stockout.rules.length == 0){
                  rule.isDefault = true;
                }
                stockout.rules.push(rule);
              }
            })
            if(stockout.rules.length == 0){
              stockout.rules.push({
                id: codeResults.codes[0],
                name: dataElementResults.dataElements[0].displayName,
                isDefault:true,
                description: "This is the rule. Using the data element '" + dataElementResults.dataElements[0].displayName+ "'.",
                json: {"data": dataElementResults.dataElements[0].id}
              });
            }
            this.save(stockout).subscribe((res)=>{
              observable.next(res);
              observable.complete();
            },(error)=>{
              observable.error(error.json());
              observable.complete();
            })
          },(error)=>{
            observable.error(error.json());
            observable.complete();
          })
        }

      },(error)=>{
        observable.error(error.json());
        observable.complete();
      })
    })
  }
  createCompletenessFunctions(){
    return new Observable((observable)=>{
      let completeness:any = {
        "function": "//Example of function implementation\n$.ajax({\n\turl: \"../../../api" +this.apiVersion+ "/analytics.json?dimension=dx:\" + parameters.rule.json.data + \".REPORTING_RATE&dimension=pe:\" + parameters.pe + \"&dimension=ou:\" + parameters.ou,\n\ttype: \"GET\",\n\tsuccess: function(analyticsResults) {\n\t    var rows = [];\n\t    analyticsResults.rows.forEach(function(row){\n\t        if(parseFloat(row[3]) > 100){\n\t            row[3] = \"100\";\n\t        }\n\t        rows.push(row);\n\t    })\n\t    analyticsResults.rows = rows;\n\t\tparameters.success(analyticsResults);\n\t},\n\terror:function(error){\n\t\t  parameters.error(error);\n\t}\n});",
        "rules": [
        ],
        "name": "Limit Reporting Rate to 100% Maximum",
        "description": "This returns completeness. If the completeness is over a hundred it returns 100."
      };
      this.http.get("dataSets.json?paging=false").subscribe((dataSetResults)=>{
        this.getId(dataSetResults.dataSets.length + 1).subscribe((codeResults)=>{
          dataSetResults.dataSets.forEach((dataSet,index)=>{
            let rule:any = {
              id: codeResults.codes[index],
              name: dataSet.displayName + " Completeness",
              description: "This is the rule. Using the data set '" + dataSet.displayName+ "'.",
              json: {"data": dataSet.id}
            }
            if(index == 0){
              rule.isDefault = true;
            }
            completeness.rules.push(rule);
          })
          this.save(completeness).subscribe((res)=>{
            observable.next(res);
            observable.complete();
          },(error)=>{
            observable.error(error.json());
            observable.complete();
          })
        },(error)=>{
          observable.error(error.json());
          observable.complete();
        })
      },(error)=>{
        observable.error(error.json());
        observable.complete();
      })
    })
  }
  createEarlyCompletenessFunctions(){
    return new Observable((observable)=>{
      let completeness:any = {
        "function": "//Example of function implementation\nparameters.progress(50);\nfunction getOrgUnitDataSetCompleteness(ds,ou,pe){\n\treturn new Promise(function(resolve, reject) {\n\t\t$.ajax({\n\t\t\turl: \"../../../api/26/completeDataSetRegistrations.json?dataSet=\" + ds.join(\"&dataSet=\") + \"&orgUnit=\" + ou + \"&period=\" + pe.join(\"&period=\")+\"&children=true\",\n\t\t\ttype: \"GET\",\n\t\t\tsuccess: function(completeness) {\n\t\t\t\t  resolve(completeness.completeDataSetRegistrations);\n\t\t\t},\n\t\t\terror:function(error){\n\t\t\t\t  parameters.error(error);\n\t\t\t}\n\t\t});\n\t} );\n}\nfunction getDataSetCompleteness(ds,ou,pe){\n\treturn new Promise(function(resolve, reject) {\n\t\tvar promises = [];\n\t\t\n\t    ou.forEach(function(o){\n\t        promises.push(getOrgUnitDataSetCompleteness(ds,o,pe));\n\t    })\n\t    Promise.all(promises).then(function(results){\n\t\t\tconsole.log(\"Results:\",results);\n\t\t\tvar completeness = [];\n\t\t\tresults.forEach(function(result){\n\t\t\t    if(result)\n\t\t\t\tresult.forEach(function(completeDataSetRegistration){\n\t\t\t\t\tvar isFound = false;\n\t\t\t\t\tcompleteness.forEach(function(addedCompleteness){\n\t\t\t\t\t\tif(addedCompleteness.period == completeDataSetRegistration.period && \n\t\t\t\t\t\taddedCompleteness.dataSet == completeDataSetRegistration.dataSet &&\n\t\t\t\t\t\taddedCompleteness.organisationUnit == completeDataSetRegistration.organisationUnit){\n\t\t\t\t\t\t\tisFound = true;\n\t\t\t\t\t\t}\n\t\t\t\t\t})\n\t\t\t\t\tif(!isFound){\n\t\t\t\t\t\tcompleteness.push(completeDataSetRegistration);\n\t\t\t\t\t}\n\t\t\t\t})\n\t\t\t})\n\t\t\tresolve(completeness);\n\t\t})\n\t} );\n}\n\nfunction getDataSets(dataSetIds){\n\treturn new Promise(function(resolve, reject) {\n\t\t$.ajax({\n\t\t\turl: \"../../../api/25/dataSets.json?fields=organisationUnits[id,path]&filter=id:in:[\" + dataSetIds.join(\",\") +\"]\",\n\t\t\ttype: \"GET\",\n\t\t\tsuccess: function(dataSetResults) {\n\t\t\t\t  resolve(dataSetResults.dataSets);\n\t\t\t},\n\t\t\terror:function(error){\n\t\t\t\t  parameters.error(error);\n\t\t\t}\n\t\t});\n\t} );\n}\nfunction getAnalyticsObject(){\n\treturn new Promise(function(resolve, reject) {\n\t\t$.ajax({\n\t\t\turl: \"../../../api/25/analytics.json?dimension=pe:\" + parameters.pe + \"&dimension=ou:\" + parameters.ou + \"&displayProperty=NAME&skipData=true\",\n\t\t\ttype: \"GET\",\n\t\t\tsuccess: function(results) {\n\t\t\t\tresults.headers = [\n\t\t\t\t\t\t\t\t{\n\t\t\t\t\t\t\t\t  \"name\": \"dx\",\n\t\t\t\t\t\t\t\t  \"column\": \"Data\",\n\t\t\t\t\t\t\t\t  \"valueType\": \"TEXT\",\n\t\t\t\t\t\t\t\t  \"type\": \"java.lang.String\",\n\t\t\t\t\t\t\t\t  \"hidden\": false,\n\t\t\t\t\t\t\t\t  \"meta\": true\n\t\t\t\t\t\t\t\t},\n\t\t\t\t\t\t\t\t{\n\t\t\t\t\t\t\t\t  \"name\": \"pe\",\n\t\t\t\t\t\t\t\t  \"column\": \"Period\",\n\t\t\t\t\t\t\t\t  \"valueType\": \"TEXT\",\n\t\t\t\t\t\t\t\t  \"type\": \"java.lang.String\",\n\t\t\t\t\t\t\t\t  \"hidden\": false,\n\t\t\t\t\t\t\t\t  \"meta\": true\n\t\t\t\t\t\t\t\t},\n\t\t\t\t\t\t\t\t{\n\t\t\t\t\t\t\t\t  \"name\": \"ou\",\n\t\t\t\t\t\t\t\t  \"column\": \"Organisation unit\",\n\t\t\t\t\t\t\t\t  \"valueType\": \"TEXT\",\n\t\t\t\t\t\t\t\t  \"type\": \"java.lang.String\",\n\t\t\t\t\t\t\t\t  \"hidden\": false,\n\t\t\t\t\t\t\t\t  \"meta\": true\n\t\t\t\t\t\t\t\t},\n\t\t\t\t\t\t\t\t{\n\t\t\t\t\t\t\t\t  \"name\": \"value\",\n\t\t\t\t\t\t\t\t  \"column\": \"Value\",\n\t\t\t\t\t\t\t\t  \"valueType\": \"NUMBER\",\n\t\t\t\t\t\t\t\t  \"type\": \"java.lang.Double\",\n\t\t\t\t\t\t\t\t  \"hidden\": false,\n\t\t\t\t\t\t\t\t  \"meta\": false\n\t\t\t\t\t\t\t\t}\n\t\t\t\t\t\t\t  ]\n\t\t\t\tresults.metaData.names[parameters.rule.id] = parameters.rule.name;\n\t\t\t\tresults.metaData.dx = [parameters.rule.id];\n\t\t\t\tresolve(results);\n\t\t\t},\n\t\t\terror:function(error){\n\t\t\t\treject(error);\n\t\t\t}\n\t\t});\n\t} );\n}\nfunction getOrgUnitHierarchy(){\n\treturn new Promise(function(resolve, reject) {\n\t\t$.ajax({\n\t\t\turl: \"../../../api/25/analytics.json?dimension=pe:\" + parameters.pe + \"&dimension=ou:\" + parameters.ou + \";LEVEL-6&displayProperty=NAME&skipData=true\",\n\t\t\ttype: \"GET\",\n\t\t\tsuccess: function(results) {\n\t\t\t\tresolve(results.metaData);\n\t\t\t},\n\t\t\terror:function(error){\n\t\t\t\treject(error);\n\t\t\t}\n\t\t});\n\t} );\n}\n\nvar dataSetIds = [\"s4029egvhCv\",\"z2slLbjn7PM\"];\ngetAnalyticsObject().then(function(results){\n\tgetDataSets(dataSetIds).then(function(dataSets){\n\t\tgetDataSetCompleteness(dataSetIds,results.metaData.ou,results.metaData.pe).then(function(completeness){\n\t\t\tif(completeness)\n\t\t\tresults.metaData.ou.forEach(function(ou){\n\t\t\t\tresults.metaData.pe.forEach(function(pe){\n\t\t\t\t\tvar denominator = 0;\n\t\t\t\t\tvar numerator = 0;\n\t\t\t\t\tvar dataSetMapper = {};\n\t\t\t\t\tdataSets.forEach(function(dataSet){\n\t\t\t\t\t\tdataSet.organisationUnits.forEach(function(orgUnit){\n\t\t\t\t\t\t\tcompleteness.forEach(function(completenessData){\n\t\t\t\t\t\t\t\tif(completenessData.period == pe && completenessData.organisationUnit == orgUnit.id && orgUnit.path.indexOf(ou) > -1){\n\t\t\t\t\t\t\t\t\tif(!dataSetMapper[orgUnit.id]){\n\t\t\t\t\t\t\t\t\t\tdataSetMapper[orgUnit.id] = {};\n\t\t\t\t\t\t\t\t\t}\n\t\t\t\t\t\t\t\t\tdataSetMapper[orgUnit.id][completenessData.dataSet] = completenessData.date;\n\t\t\t\t\t\t\t\t}\n\t\t\t\t\t\t\t})\n\t\t\t\t\t\t})\n\t\t\t\t\t})\n\t\t\t\t\tObject.keys(dataSetMapper).forEach(function(key){\n\t\t\t\t\t\tif(dataSetMapper[key][dataSetIds[0]] && dataSetMapper[key][dataSetIds[1]]){\n\t\t\t\t\t\t\tnumerator +=Math.abs(daysBetween(new Date(dataSetMapper[key][dataSetIds[0]]),new Date(dataSetMapper[key][dataSetIds[1]])));\n\t\t\t\t\t\t\tdenominator++;\n\t\t\t\t\t\t}\n\t\t\t\t\t})\n\t\t\t\t\tif(denominator != 0){\n\t\t\t\t\t\tresults.rows.push([parameters.rule.id,pe,ou,(numerator/denominator).toFixed(2)]);\n\t\t\t\t\t}\n\t\t\t\t})\n\t\t\t})\n\t\t\tresults.height = results.rows.length;\n\t\t\tresults.width = results.headers.length;\n\t\t\tconsole.log(\"Analytics Results:\",results);\n\t\t\tparameters.success(results);\n\t\t})\n\t})\n})\nfunction daysBetween( date1, date2 ) {   //Get 1 day in milliseconds   \n\tvar one_day=1000*60*60*24;    // Convert both dates to milliseconds\n\tvar date1_ms = date1.getTime();   \n\tvar date2_ms = date2.getTime();    // Calculate the difference in milliseconds  \n\tvar difference_ms = date2_ms - date1_ms;        // Convert back to days and return   \n\treturn Math.round(difference_ms/one_day); \n } \n",
        "rules": [
        ],
        "name": "Proportion of Early Completeness",
        "description": "Calculates how early the report was submitted\n\nNumerator: Is the difference from the submission date and deadline date\n\nDenominator: Number of submission date"
      };
      this.http.get("dataSets.json?paging=false").subscribe((dataSetResults)=>{
        this.getId(dataSetResults.dataSets.length + 1).subscribe((codeResults)=>{
          dataSetResults.dataSets.forEach((dataSet,index)=>{
            let rule:any = {
              id: codeResults.codes[index],
              name: dataSet.displayName + " Early Completeness",
              description: "This is the rule. Using the data set '" + dataSet.displayName+ "'.",
              json: {"data": dataSet.id}
            }
            if(index == 0){
              rule.isDefault = true;
            }
            completeness.rules.push(rule);
          })
          this.save(completeness).subscribe((res)=>{
            observable.next(res);
            observable.complete();
          },(error)=>{
            observable.error(error.json());
            observable.complete();
          })
        },(error)=>{
          observable.error(error.json());
          observable.complete();
        })
      },(error)=>{
        observable.error(error.json());
        observable.complete();
      })
    })
  }
  createReportingRateByFilledData(){
    return new Observable((observable)=>{
      let completeness:any = {
        "function": "//Example of function implementation\nparameters.progress(50);\n\nfunction analyticsRequest() {\n    return new Promise(function(resolve, reject) {\n        $.ajax({\n            url: \"../../../api/25/analytics.json?dimension=pe:\" + parameters.pe + \"&dimension=ou:\" + parameters.ou + \"&hierarchyMeta=true&skipData=true\",\n            type: \"GET\",\n            success: function(analyticsResults) {\n                try {\n                    analyticsResults.headers = [{\"name\":\"dx\",\"column\":\"Data\",\"valueType\":\"TEXT\",\"type\":\"java.lang.String\",\"hidden\":false,\"meta\":true},{\"name\":\"pe\",\"column\":\"Period\",\"valueType\":\"TEXT\",\"type\":\"java.lang.String\",\"hidden\":false,\"meta\":true},{\"name\":\"ou\",\"column\":\"Organisation unit\",\"valueType\":\"TEXT\",\"type\":\"java.lang.String\",\"hidden\":false,\"meta\":true},{\"name\":\"value\",\"column\":\"Value\",\"valueType\":\"NUMBER\",\"type\":\"java.lang.Double\",\"hidden\":false,\"meta\":false}];\n                    analyticsResults.metaData.names[parameters.rule.id] = parameters.rule.name;\n                    analyticsResults.metaData.dx = [parameters.rule.id];\n                    resolve(analyticsResults);\n                } catch (error) {\n                    reject(error);\n                }\n            },\n            error: function(error) {\n                reject(error);\n            }\n        });\n    })\n}\n\nfunction analyticsLevelRequest(level) {\n    return new Promise(function(resolve, reject) {\n        $.ajax({\n            url: \"../../../api/25/analytics.json?dimension=pe:\" + parameters.pe + \"&dimension=ou:\" + parameters.ou + \";LEVEL-\" + level + \"&hierarchyMeta=true\",\n            type: \"GET\",\n            success: function(analyticsResults) {\n                try {\n                    resolve(analyticsResults.metaData.ouHierarchy);\n                } catch (error) {\n                    reject(error);\n                }\n            },\n            error: function(error) {\n                reject(error);\n            }\n        });\n    })\n}\n\nfunction dataValueSetsRequest() {\n    return new Promise(function(resolve, reject) {\n        $.ajax({\n            url: \"../../../api/25/dataSets/\" + parameters.rule.json.data + \".json?fields=id,timelyDays,periodType,organisationUnits[level]\",\n            type: \"GET\",\n            success: function(dataValueSetsResults) {\n                try {\n                    //Code goes here\n                    resolve(dataValueSetsResults);\n                } catch (e) {\n                    reject(error);\n                }\n            },\n            error: function(error) {\n                reject(error);\n            }\n        });\n    })\n}\nanalyticsRequest().then(function(results) {\n    dataValueSetsRequest().then(function(dataSet) {\n        analyticsLevelRequest(dataSet.organisationUnits[0].level).then(function(hierarchy) {\n            $.ajax({\n                url: \"../../../api/26/completeDataSetRegistrations.json?dataSet=\" + parameters.rule.json.data + \"&orgUnit=\" + results.metaData.ou.join(\"&orgUnit=\") + \"&children=true&period=\" + results.metaData.pe.join(\"&period=\"),\n                type: \"GET\",\n                success: function(completenessResults) {\n                    if (completenessResults.completeDataSetRegistrations)\n                        results.metaData.ou.forEach(function(ou) {\n                            results.metaData.pe.forEach(function(pe) {\n                                var startDate = getDateAfterEndOfPeriod(dataSet.periodType, pe)\n                                startDate.setDate(startDate.getDate() + dataSet.timelyDays)\n                                var secondDate;\n                                var facilities = 0;\n                                var totalDifference = 0;\n                                completenessResults.completeDataSetRegistrations.forEach(function(completeDataSetRegistration) {\n                                    if(hierarchy[completeDataSetRegistration.organisationUnit])\n                                    if (completeDataSetRegistration.period == pe && hierarchy[completeDataSetRegistration.organisationUnit].indexOf(ou) > -1) {\n                                        var difference = daysBetween(new Date(completeDataSetRegistration.date),startDate);\n                                        console.log(\"Difference:\",startDate,completeDataSetRegistration.date,difference)\n                                        if(difference > 0){\n                                            totalDifference += difference;\n                                        }\n                                        facilities++;\n                                    }\n                                })\n                                if (facilities != 0) {\n                                    console.log(totalDifference,dataSet.timelyDays,facilities)\n                                    results.rows.push([parameters.rule.id, pe, ou, (totalDifference / (dataSet.timelyDays * facilities)).toFixed(2)])\n                                }\n                            })\n                        })\n                    results.height = results.rows.length\n                    console.log(results);\n                    parameters.success(results);\n                },\n                error: function(error) {\n                    parameters.error(error);\n                }\n            });\n        })\n    })\n})\n\nfunction daysBetween(date1, date2) { //Get 1 day in milliseconds   \n    var one_day = 1000 * 60 * 60 * 24; // Convert both dates to milliseconds\n    var date1_ms = date1.getTime();\n    var date2_ms = date2.getTime(); // Calculate the difference in milliseconds  \n    var difference_ms = date2_ms - date1_ms; // Convert back to days and return   \n    return Math.round(difference_ms / one_day);\n}\n\nfunction getDateAfterEndOfPeriod(periodType, pe) {\n    var date = new Date();\n    if (periodType == \"Yearly\") {\n        date = new Date(parseInt(pe.substr(0, 4)) + 1, 0, 1)\n    }else if (periodType == \"Monthly\") {\n        date = new Date(parseInt(pe.substr(0, 4)) + 1, parseInt(pe.substr(4)), 1)\n    }else if(periodType == \"Quarterly\"){\n        var firstDate = new Date(now.getFullYear(), parseInt(pe.substr(5)) * 3, 1);\n        date = new Date(firstDate.getFullYear(), firstDate.getMonth() + 3, 1);\n    }\n    return date;\n}",
        "rules": [
        ],
        "name": "Reporting Rates By Filled data",
        "description": "Calculates the reporting rate by the amount of fields filled in the report",
      };
      this.http.get("dataSets.json?paging=false").subscribe((dataSetResults)=>{
        this.getId(dataSetResults.dataSets.length + 1).subscribe((codeResults)=>{
          dataSetResults.dataSets.forEach((dataSet,index)=>{
            let rule:any = {
              id: codeResults.codes[index],
              name: dataSet.displayName + " Reporting Rate by filled data",
              description: "This is the rule. Using the data set '" + dataSet.displayName+ "'.",
              json: {"data": dataSet.id}
            }
            if(index == 0){
              rule.isDefault = true;
            }
            completeness.rules.push(rule);
          })
          this.save(completeness).subscribe((res)=>{
            observable.next(res);
            observable.complete();
          },(error)=>{
            observable.error(error.json());
            observable.complete();
          })
        },(error)=>{
          observable.error(error.json());
          observable.complete();
        })
      },(error)=>{
        observable.error(error.json());
        observable.complete();
      })
    })
  }
  orgUnitsReportedOnDataSet(){
    return new Observable((observable)=>{
      let completeness:any = {
        "function": "//Example of function implementation\nparameters.progress(50);\n\nfunction calculatePercentageForOU(ou) {\n    return new Promise(function(resolve, reject) {\n        $.ajax({\n            url: \"../../../api/24/analytics.json?dimension=dx:\" + parameters.rule.json.data + \".REPORTING_RATE&dimension=pe:\" + parameters.pe + \"&dimension=ou:LEVEL-4;\" + ou + \"&hierarchyMeta=true\",\n            type: \"GET\",\n            success: function(analyticsResults) {\n                /**\n                 * Conditioning starts here\n                 * \n                 * */\n                var orgUnits = [];\n                analyticsResults.rows.forEach(function(row) {\n                    var orgUnitId = row[1] + '.' + row[2]\n                    if (orgUnits.indexOf(orgUnitId) == -1) {\n                        orgUnits.push(orgUnitId);\n                    }\n                })\n                analyticsResults.metaData.dx = [parameters.rule.id];\n                analyticsResults.metaData.names[parameters.rule.id] = parameters.rule.name;\n                analyticsResults.rows = [];\n                analyticsResults.metaData.pe.forEach(function(pe) {\n                    var currentPeOrgUnits = [];\n                    orgUnits.forEach(function(orgUnit) {\n                        if (orgUnit.split('.')[0] === pe) {\n                            currentPeOrgUnits.push(orgUnit)\n                        }\n                    });\n\n                    if (currentPeOrgUnits.length > 0) {\n                        analyticsResults.rows.push([parameters.rule.id, pe, ou, \"\" + (currentPeOrgUnits.length * 100 / analyticsResults.metaData.ou.length).toFixed(2)])\n                    }\n                });\n                analyticsResults.metaData.ou = [ou];\n                resolve(analyticsResults);\n            },\n            error: function(error) {\n                reject(error);\n            }\n        });\n    })\n}\n$.ajax({\n    url: \"../../../api/24/analytics.json?dimension=pe:\" + parameters.pe + \"&dimension=ou:\" + parameters.ou + \"&skipData=true\",\n    type: \"GET\",\n    success: function(dummyAnalyticsResults) {\n        var promises = [];\n        var analytics;\n        dummyAnalyticsResults.metaData.ou.forEach(function(ou) {\n            promises.push(calculatePercentageForOU(ou).then(function(analyticsResults) {\n                if (!analytics) {\n                    analytics = analyticsResults;\n                } else {\n                    analytics.metaData.ou = analytics.metaData.ou.concat(analyticsResults.metaData.ou);\n                    analyticsResults.metaData.ou.forEach(function(ouid) {\n                        analytics.metaData.names[ouid] = analyticsResults.metaData.names[ouid];\n                    })\n                    analytics.rows = analytics.rows.concat(analyticsResults.rows);\n                }\n            }));\n        })\n\n        Promise.all(promises).then(function() {\n            parameters.success(analytics);\n        }, function(error) {\n            parameters.error(error);\n        })\n    },\n    error: function(error) {\n        reject(error);\n    }\n});",
        "rules": [
        ],
        "name": "Sample Proportion of Facilities Given a condition",
        "description": "This calculates the percentage of facilities given a condition which can be modified to provide the required condition. Currently it calculates the proportion of organisation units reported on a given data set reporting rate"
      };
      this.http.get("dataSets.json?paging=false").subscribe((dataSetResults)=>{
        this.getId(dataSetResults.dataSets.length + 1).subscribe((codeResults)=>{
          dataSetResults.dataSets.forEach((dataSet,index)=>{
            let rule:any = {
              id: codeResults.codes[index],
              name: dataSet.displayName + " Reporting Rate by filled data",
              description: "This is the rule. Using the data set '" + dataSet.displayName+ "'.",
              json: {"data": dataSet.id}
            }
            if(index == 0){
              rule.isDefault = true;
            }
            completeness.rules.push(rule);
          })
          this.save(completeness).subscribe((res)=>{
            observable.next(res);
            observable.complete();
          },(error)=>{
            observable.error(error.json());
            observable.complete();
          })
        },(error)=>{
          observable.error(error.json());
          observable.complete();
        })
      },(error)=>{
        observable.error(error.json());
        observable.complete();
      })
    })
  }

  /**
   * Proportion of organisation units not reporting on a data set
   * @returns {Observable<any>}
   */
  proportionOfOrgUnitsNotReport(){
    return new Observable((observable)=>{
      let completeness:any = {
        "function": "//Example of function implementation\nparameters.progress(20);\n$.ajax({\n\turl: \"../../../api/25/analytics.json?skipData=true&dimension=pe:\" + parameters.pe + \"&dimension=ou:\" + parameters.ou,\n\ttype: \"GET\",\n\tsuccess: function(analyticsResults) {\n\t\tanalyticsResults.headers = [\n    {\n      \"name\": \"dx\",\n      \"column\": \"Data\",\n      \"valueType\": \"TEXT\",\n      \"type\": \"java.lang.String\",\n      \"hidden\": false,\n      \"meta\": true\n    },\n    {\n      \"name\": \"pe\",\n      \"column\": \"Period\",\n      \"valueType\": \"TEXT\",\n      \"type\": \"java.lang.String\",\n      \"hidden\": false,\n      \"meta\": true\n    },\n    {\n      \"name\": \"ou\",\n      \"column\": \"Organisation unit\",\n      \"valueType\": \"TEXT\",\n      \"type\": \"java.lang.String\",\n      \"hidden\": false,\n      \"meta\": true\n    },\n    {\n      \"name\": \"value\",\n      \"column\": \"Value\",\n      \"valueType\": \"NUMBER\",\n      \"type\": \"java.lang.Double\",\n      \"hidden\": false,\n      \"meta\": false\n    }\n  ]\n\t\tanalyticsResults.metaData.dx = [parameters.rule.id];\n\t\tanalyticsResults.metaData.names[parameters.rule.id] = parameters.rule.name;\n\t\tparameters.progress(50);\n\t\t$.ajax({\n\t\t\turl: \"../../../api/25/organisationUnits.json?paging=false&filter=level:eq:\" + parameters.rule.json.level + \"&filter=path:like:\" + parameters.ou + \"&fields=dataSets[id]\",\n\t\t\ttype: \"GET\",\n\t\t\tsuccess: function(orgUnitResults) {\n\t\t\t\tvar count = 0;\n\t\t\t\torgUnitResults.organisationUnits.forEach(function(orgUnit){\n\t\t\t\t\torgUnit.dataSets.forEach(function(dataSet){\n\t\t\t\t\t\tif(dataSet.id == parameters.rule.json.dataSet){\n\t\t\t\t\t\t\tcount++;\n\t\t\t\t\t\t}\n\t\t\t\t\t})\n\t\t\t\t})\n\t\t\t\tanalyticsResults.metaData.ou.forEach(function(ou){\n\t\t\t\t\tanalyticsResults.metaData.pe.forEach(function(pe){\n\t\t\t\t\t\tanalyticsResults.rows.push([parameters.rule.id,parameters.pe,parameters.ou,\"\"+ (orgUnitResults.organisationUnits.length - count)]);\n\t\t\t\t\t})\n\t\t\t\t})\n\t\t\t\tparameters.progress(100);\n\t\t\t\tparameters.success(analyticsResults);\n\t\t\t},\n\t\t\terror:function(error){\n\t\t\t\t  parameters.error(error);\n\t\t\t}\n\t\t});\n\t},\n\terror:function(error){\n\t\t  parameters.error(error);\n\t}\n});",
        "rules": [
        ],
        "name": "Percentage of Org Units Not Reporting a dataset",
        "description": "Calculates the percentage of organisation units not reporting a dataset",
      };
      this.http.get("dataSets.json?paging=false&fields=id,displayName,organisationUnits[level]").subscribe((dataSetResults)=>{
        this.getId(dataSetResults.dataSets.length + 1).subscribe((codeResults)=>{
          dataSetResults.dataSets.forEach((dataSet,index)=>{
            let level = 1;
            if(dataSet.organisationUnits.length > 0){
              level = dataSet.organisationUnits[0].level
            }
            let rule:any = {
              id: codeResults.codes[index],
              name: dataSet.displayName + " Reporting Rate by filled data",
              description: "This is the rule. Using the data set '" + dataSet.displayName+ "'.",
              json: {"data": dataSet.id,"level":level}
            }
            if(index == 0){
              rule.isDefault = true;
            }
            completeness.rules.push(rule);
          })
          this.save(completeness).subscribe((res)=>{
            observable.next(res);
            observable.complete();
          },(error)=>{
            observable.error(error.json());
            observable.complete();
          })
        },(error)=>{
          observable.error(error.json());
          observable.complete();
        })
      },(error)=>{
        observable.error(error.json());
        observable.complete();
      })
    })
  }
  get(id){
    return new Observable((observable)=>{
      this.http.get("dataStore/functions/" + id).subscribe((func)=>{
        observable.next(func);
        observable.complete();
      },(error)=>{
        observable.error(error.json());
        observable.complete();
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
