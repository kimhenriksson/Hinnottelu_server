const express = require('express')
const cors = require('cors');
const AWS = require('aws-sdk');
const bodyParser = require("body-parser");
const attr = require('dynamodb-data-types').AttributeValue
const attrUpdate = require('dynamodb-data-types').AttributeValueUpdate;

const app = express();
app.use(cors());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

AWS.config.update({region: 'eu-central-1'});
const dynamodb = new AWS.DynamoDB({apiVersion: '2012-10-08'});


const scan = (params, req, res) => {
  dynamodb.scan(params, (err, data) => {
    if (err) {
        console.error("Unable to scan table. Error JSON:", JSON.stringify(err, null, 2));
        res.status(412);
    } else {
        console.log("scaned table:", JSON.stringify(data.Items, null, 2));
        let r = data.Items.map((item)=> (attr.unwrap(item)));
        res.send(r);
    }
  });
}

const updateItem = (params, req, res) => {
  dynamodb.updateItem(params, function(err, data) {
    if (err) {
        console.error("Unable to add item. Error JSON:", JSON.stringify(err, null, 2));
    } else {
        console.log("Updated item:", JSON.stringify(data, null, 2));
        let r = attr.unwrap(data.Attributes)
        res.send(r);
    }
  });
}

const deleteItem = (params, req, res) => {
  dynamodb.deleteItem(params, function(err, data) {
    if (err) {
      console.error("Unable to delete item. Error JSON:", JSON.stringify(err, null, 2));
      res.status(412);
      res.send("Unable to delete item.");
    } else {
      console.log("Deleted item:", JSON.stringify(data, null, 2));
      let r = attr.unwrap(data.Attributes);
      res.send(r);
    }
  });
}

const addItem = (params, req, res) => {
  dynamodb.putItem(params, function(err, data) {
    if (err) {
      console.error("Unable to add item. Error JSON:", JSON.stringify(err, null, 2));
      res.status(412);
      res.send("Unable to add item.");
    } else {
      console.log("Added item:", JSON.stringify(data, null, 2));
      let r = attr.unwrap(data.Attributes);
      res.send(r);
    }
  });
}


app.get('/api/getRAData', (req, res) => {
  var params = {
    TableName:"raaka_aineet",
  }
  scan(params,req,res);
})

app.get('/api/getRAData:rakoodi', (req, res) => {
  console.log(req.params.rakoodi);
  var params = {
    TableName:"raaka_aineet",
    Key: {
     "ra_koodi": {
       S: req.params.rakoodi
      }
    }
  }

  dynamodb.getItem(params, function(err, data) {
    if (err) {
        console.error("Unable to scan table. Error JSON:", JSON.stringify(err, null, 2));
    } else {
        console.log("scaned table:", JSON.stringify(data.Items, null, 2));
        res.send(data.Items);
    }
  });
})

app.post('/',(req,res) => {
  console.log(req.body);      // your JSON
  res.send(res.body);
})

app.post('/api/updateRaakaAine', (req, res) => {
  var params = {
      TableName:"raaka_aineet",
      Key: {
        "ra_koodi": {
            "S": req.body.ra_koodi
        },
      },
      UpdateExpression: "set ra_nimike = :ra_nimike , raaka_aine=:raaka_aine, ominaispaino = :ominaispaino, aineenvahvuus = :aineenvahvuus",
      ExpressionAttributeValues:{
          ":ra_nimike": {S:req.body.ra_nimike},
          ":raaka_aine": {S:req.body.raaka_aine},
          ":ominaispaino": {S:req.body.ominaispaino.toString()},
          ":aineenvahvuus": {S:req.body.aineenvahvuus.toString()}
      },
      ReturnValues: 'ALL_NEW',
  };
  updateItem(params, req,res);
})

app.get('/api/tyokustannus',(req,res) => {
  var params = {
    TableName:"tyohinnat",
  }
  scan(params,req,res);
})

app.post('/api/updateTyokustannus', (req, res) => {
  let keys = Object.keys(req.body);
  let retVal = keys.map((key) => {
    var params = {
        TableName:"tyohinnat",
        Key: {
          "tyo": {
              "S": key
          },
        },
        UpdateExpression: "set kustannus = :k",
        ExpressionAttributeValues:{
            ":k": {S:req.body[key].toString()},
        },
    };
// ALA MUUTA. NAIN KOSKA MAP, JA res.send VASTA KUN KAIKKI VALMIIT
    let ret = dynamodb.updateItem(params, function(err, data) {
      if (err) {
          console.error("Unable to add item. Error JSON:", JSON.stringify(err, null, 2));
      } else {
          console.log("Updated item:", JSON.stringify(data, null, 2));
      }
    });
  });
  res.send();
})

app.post('/api/updateYksinkertainenOsa', (req, res) => {
  var params = {
    TableName:'yksinkertaiset_osat',
    Key: {"nimike": {"S": req.body.nimike},},
    UpdateExpression: "set asiakas=:asiakas,  \
                        nimi = :nimi, \
                        piirustus = :piirustus, \
                        ra_koodi = :ra_koodi,  \
                        mitta1=:mitta1, \
                        mitta2=:mitta2, \
                        hukka = :hukka, \
                        erakoko = :erakoko, \
                        vuosivolyymi=:vuosivolyymi",
    ExpressionAttributeValues:{
        ":asiakas": {S:req.body.asiakas||'Asiakas'},
        ":nimi": {S:req.body.toimittaja||'Nimi'},
        ":piirustus": {S:req.body.piirustus||'0'},
        ":ra_koodi":{S:req.body.ra_koodi||"0"},
        ":mitta1":{S:req.body.mitta1||'0'},
        ":mitta2":{S:req.body.mitta2||'0'},
        ":hukka":{S:req.body.hukka||'0'},
        ":erakoko":{S:req.body.erakoko||'0'},
        ":vuosivolyymi":{S:req.body.vuosivolyymi||'0'},

    },
    ReturnValues: 'ALL_NEW',
  };
  console.log(params);
  updateItem(params, req,res);

  }
)

app.post('/api/updateOstoOsa', (req, res) => {
  var params = {
      TableName:"osto_osat",
      Key: {
        "nimike": {
            "S": req.body.nimike
        },
      },
      UpdateExpression: "set nimi=:nimi, toimittaja = :toimittaja, pakkaus = :pakkaus, ostohinta = :ostohinta, varastointi=:varastointi, rahti = :rahti, muuKustannus = :muuKustannus, kate=:kate",
      ExpressionAttributeValues:{
          ":nimi": {S:req.body.nimi||'Nimi'},
          ":toimittaja": {S:req.body.toimittaja||'Toimittaja'},
          ":pakkaus": {S:req.body.pakkaus||'0'},
          ":ostohinta":{S:req.body.ostohinta||"0"},
          ":varastointi":{S:req.body.varastointi||'0'},
          ":rahti":{S:req.body.rahti||'0'},
          ":muuKustannus":{S:req.body.muuKustannus||'0'},
          ":kate":{S:req.body.kate||'0'},
      },
      ReturnValues: 'ALL_NEW',
  };
  console.log(params);
  updateItem(params, req,res);
})



app.post('/api/addOstoOsa', (req, res) => {
  var params = {
    TableName:"osto_osat",
    Item: {
      "nimike": {
          "S": req.body.nimike
      },
    },
    ConditionExpression: "attribute_not_exists(nimike)",
    ReturnValues: 'NONE',
  };
  addItem(params, req, res);
});

app.post('/api/addYksinkertaisetOsat', (req, res) => {
  var params = {
    TableName:"yksinkertaiset_osat",
    Item: {
      "nimike": {
          "S": req.body.nimike
      },
    },
    ConditionExpression: "attribute_not_exists(nimike)",
    ReturnValues: 'NONE',
  };
  addItem(params, req, res);
})

app.delete('/api/deleteOstoOsa', (req, res) => {
  var params = {
      TableName:"osto_osat",
      Key: {
        "nimike": {
            "S": req.body.nimike
        },
      },
  };
  deleteItem(params,req,res);
});

app.delete('/api/deleteYksinkertainenOsa', (req, res) => {
  var params = {
      TableName:"yksinkertaiset_osat",
      Key: {
        "nimike": { "S": req.body.nimike},
      },
  };
  deleteItem(params,req,res);
});

app.get('/api/getYksinkertaisetOsat',(req,res) => {
  var params = {
    TableName:"yksinkertaiset_osat",
  }
  scan(params,req,res);
})




app.get('/api/getOstoOsa',(req,res) => {
  var params = {
    TableName:"osto_osat",
  }
  scan(params,req,res);
})

app.post('/api/addHinta',(req,res) => {
  console.log(req.body);      // your JSON
  res.send(res.body);
  var params = {
      TableName:"rahinnat",
      Item:{
          "ra_koodi": {S:req.body.ra_koodi},
          "hinnan_pva": {S:req.body.hinnan_pva},
          "ra_hinta":{N:req.body.ra_hinta},
          "updated":{S:Date.now().toString()},
          "updater":{S:"unknown"},
      }
    }

  dynamodb.updateItem(params, function(err, data) {
    if (err) {
        console.error("Unable to add item. Error JSON:", JSON.stringify(err, null, 2));
    } else {
        console.log("Added item:", JSON.stringify(data, null, 2));
    }
  });
})

app.get('/api/getHinta', (req,res) => {
  var params = {
    TableName:"rahinnat"
  }
  scan(params,req,res);
})


app.get('/api/getHinta:rakoodi', (req,res) => {
  console.log(req.params.rakoodi);

  var params = {
    ExpressionAttributeValues: {
      ":v1": {
      S: req.params.rakoodi
     }
   },
   KeyConditionExpression: "ra_koodi = :v1",

   TableName: "rahinnat"
  };

  dynamodb.query(params, function(err, data) {
    if (err) {
        console.error("Unable to get hinta table. Error JSON:", JSON.stringify(err, null, 2));
    } else {
        console.log("gethinta table:", JSON.stringify(data, null, 2));
        res.send(data);
    }
  });
})

app.listen(8081, () => console.log('App listening on port 8081'))
