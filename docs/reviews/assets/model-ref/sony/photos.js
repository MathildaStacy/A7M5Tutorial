const sonyPhotoFiles = {
  'press-combo-angle': 'ILCE-7M5_image_SEL2470GM2_right-Large.jpg',
  'press-back': 'ILCE-7M5_rear-Large.jpg',
  'press-top': 'ILCE-7M5_top-Large.jpg',
  'lens-B': 'Alpha-Universe-Sony-24-70-GM-II-SEL2470GM2_B.jpg',
  'press-combo-top': 'ILCE-7M5_SEL2470GM2_top-Large.jpg',
};

function showReferencePhoto(name, original, overlay, links) {
  function display(url) {
    original.src = url;
    overlay.src = url;
    for (const link of links) link.href = url;
  }

  original.onerror = () => {
    original.onerror = null;
    display('https://alphauniverseglobal.media.zestyio.com/' + sonyPhotoFiles[name]);
  };
  display('../assets/model-ref/sony/' + name + '.jpg');
}
