$( document ).ready(function() {
  console.log("ready");

  document.getElementById('upload').addEventListener('change', handleFileSelect, false);

  var ExcelToJSON = function() {

    this.parseExcel = function(file) {
      var reader = new FileReader();

      reader.onload = function(e) {
        var data = e.target.result;
        var workbook = XLSX.read(data, {
          type: 'binary'
        });
        workbook.SheetNames.forEach(function(sheetName) {
          // Here is your object
          var XL_row_object = XLSX.utils.sheet_to_row_object_array(workbook.Sheets[sheetName]);

          // Send each row to ArcGIS Server
          for (var i = 0; i < XL_row_object.length; i++){
            var row = XL_row_object[i];
            addRecord(row);
            // console.log(row);
          }

          var json_object = JSON.stringify(XL_row_object);
          jQuery( '#xlx_json' ).val( json_object );
        })
      };

      reader.onerror = function(ex) {
        console.log(ex);
      };

      reader.readAsBinaryString(file);
    };
  };

  function handleFileSelect(evt) {

    var files = evt.target.files; // FileList object
    var xl2json = new ExcelToJSON();
    xl2json.parseExcel(files[0]);
  }

  function addRecord(row){
    // Format the row
    var data = {
      f: "json",
      adds: JSON.stringify([{
          "geometry": {"spatialReference": {"latestWkid":3857,"wkid":102100},"x": parseInt(row['x']),"y": parseInt(row['y'])},
          "attributes": {"Description": row['Description'],"HazardType": row['HazardType']}
        }
      ])
    }

    // Send to ArcGIS Server
    $.ajax({
        url: "https://services.arcgis.com/V6ZHFr6zdgNZuVG0/arcgis/rest/services/Hazards_Uptown_Charlotte/FeatureServer/0/applyEdits",
        data: data,
        type: 'POST',
        datatype: 'jsonp',
        crossDomain: true,
        contentType: 'application/x-www-form-urlencoded'
      }).done(function(response) {
        console.log(response);
        jQuery( '#server-response' ).val(jQuery( '#server-response' ).val() + "\n\n" + response)
      }).catch((err) => {
        console.error("Error", err)
      });

  }
});
