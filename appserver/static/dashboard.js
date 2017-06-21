require([
  'splunkjs/ready!',
  'splunkjs/mvc/simplexml/ready!',
  'underscore',
  'jquery'
  ], function(
    mvc,
    ignored,
    _,
    $
  ) {
    // Get Required TA version
    var dependencyVersion;
    $.ajax({
      url:"/en-US/splunkd/__raw/servicesNS/admin/SplunkforPaloAltoNetworks/configs/conf-app/install",
      data: {
            "output_mode": "json"
        },
        type: "GET",
        dataType : "json"
    }).done(function(response) {
      for(var i = 0; i < response.entry.length; i++) {
        dependencyVersion = response.entry[i].content.ta_dependency_version;
      }
    })            

    var check_TA = sessionStorage.checked_ta

    // Only check if the TA is install once per a session.
    if (!check_TA) {
      var service = mvc.createService();
      service.apps()
      .fetch(function(err, apps) {
        if (err) {
          sendDevLog( err);
          console.error(err);
          return;
        }

        // Check if the Add-on is installed.
        var paloaltoTA = apps.item('Splunk_TA_paloalto');
        if (!paloaltoTA) {
          // TA is not installed.
          var title = "Missing Add-on";
          var message = '<p>Please install the <a href="https://splunkbase.splunk.com/app/2757/" target="_blank">Palo Alto Networks Add-on</a>.</p> \
            <p>For more information please view the <a href="http://pansplunk.readthedocs.io/en/latest/" target="_blank">getting started documentation</a>.</p>';
          deployModal(title, message);
          sessionStorage.checked_ta = 1;
        } else {
          // TA is installed
          // Check the version to see if it matches dependency.
          var looseVersion =  paloaltoTA._properties.version;
          if (looseVersion >= dependencyVersion) {
            // Everything passed. Adding to session storage to not check the TA anymore.
            sessionStorage.checked_ta = 1;
          } else {
            var title = "Add-on Dependency Warning";
            var message = '<p>The current verison of the Palo Alto Networks Add-on you have installed does not match the required version needed for this app. </p>\
              <p>Installed version: ' + looseVersion + '</p> \
              <p>The version required is: ' + dependencyVersion + '</p> \
              <p>Please download the required version from <a href="https://splunkbase.splunk.com/app/2757/" target="_blank">Splunk Base</a></p>';
            deployModal(title, message); 
            sessionStorage.checked_ta = 1;
          }
        }
      });
    }
});
// Function to deploy the modal.
function deployModal(title, message) {
  console.log("modal deployed");
  var htmlData = '<div class="modal fade" role="dialog" tabindex="-1" id="pan_message"> \
    <div class="modal-dialog" role="document"> \
    <div class="modal-content"> \
    <div class="modal-header"> \
    <h4 class="modal-title">' + title + '</h4> \
    </div> \
    <div class="modal-body"> \
    ' + message + ' \
    </div> \
    <div class="modal-footer"> \
    <button type="button" class="btn btn-default" data-dismiss="modal" id="ta_check_close">Close</button> \
    </div> \
    </div> \
    </div>';

    $( "body" ).append(htmlData);
    $( "#pan_message" ).modal('show');
}