begin;

update public.dg_products
set
  images = array[
    'https://files.manuscdn.com/user_upload_by_module/session_file/310519663584190080/ZQsNdgoHHcLGfpxE.jpg',
    'https://files.manuscdn.com/user_upload_by_module/session_file/310519663584190080/fyjHyiVtbwfnvOXw.jpg',
    'https://files.manuscdn.com/user_upload_by_module/session_file/310519663584190080/uVrooxodZiHbRvZh.jpg',
    'https://files.manuscdn.com/user_upload_by_module/session_file/310519663584190080/npvNJPUYHhMFEPHl.jpg',
    'https://files.manuscdn.com/user_upload_by_module/session_file/310519663584190080/mMtYOdwHPxzwPbRo.jpg',
    'https://files.manuscdn.com/user_upload_by_module/session_file/310519663584190080/wfHlqXsfHHLRxsoD.jpg',
    'https://files.manuscdn.com/user_upload_by_module/session_file/310519663584190080/ZDlTfrbahCGhhwye.jpg',
    'https://files.manuscdn.com/user_upload_by_module/session_file/310519663584190080/FfSqsTAHArAyZjbY.jpg',
    'https://files.manuscdn.com/user_upload_by_module/session_file/310519663584190080/LebxzjfUFblSQDtt.jpg'
  ],
  short_description = 'Water-resistant YJ children’s school backpack with colour choices, organised storage, padded support, and a protected laptop or tablet compartment for school, daycare, travel, and everyday carry.',
  description = 'Make school mornings easier with a practical YJ children’s backpack designed for organised everyday carry. The water-resistant nylon construction helps protect books and essentials during normal daily use, while the structured design keeps school items easy to reach.\n\nKey features include two side pockets, a front pocket, an interior zipped pocket, two organiser pockets, and a dedicated laptop or tablet compartment suitable for devices up to 14 inches when the selected size is appropriate. Padded shoulder straps and a cushioned back panel are designed for more comfortable carrying.\n\nApproximate size options shown in the supplier information are 40 × 30 × 16 cm and 36 × 28 × 14 cm. Choose the available colour and size option shown on the product page. Suitable for boys and girls aged approximately 3–12 for school, preschool, daycare, travel, toys, or lunch items. Product dimensions, colour, and availability should be confirmed before dispatch.',
  seo_title = 'YJ Children’s School Backpack in Red, Pink and Blue | DailyGear Kenya',
  seo_description = 'Shop the YJ children’s school backpack from DailyGear Kenya. Choose an available colour and size, with organised compartments, padded support, and a laptop or tablet compartment for everyday school carry.',
  seo_keywords = array['YJ school bag', 'children school backpack Kenya', 'kids school bag', 'water-resistant school backpack', 'school bag for boys and girls', 'DailyGear Kenya'],
  image_alt_text = 'YJ children school backpack colour collection with organised compartments and padded straps'
where id = '0e4b22cd-a2a8-4e5e-a1ca-1218df7de98b';

update public.dg_product_variants
set
  image_url = 'https://files.manuscdn.com/user_upload_by_module/session_file/310519663584190080/npvNJPUYHhMFEPHl.jpg',
  options = coalesce(options, '{}'::jsonb) || jsonb_build_object('colour', 'Blue', 'sex', 'Unisex')
where id = '8080c8e6-96f7-4e2d-be5f-80e141a681c5';

update public.dg_product_variants
set
  image_url = 'https://files.manuscdn.com/user_upload_by_module/session_file/310519663584190080/uVrooxodZiHbRvZh.jpg',
  options = coalesce(options, '{}'::jsonb) || jsonb_build_object('colour', 'Pink', 'sex', 'Unisex')
where id = '64fff337-26f9-4fd3-b370-08475ebf688d';

update public.dg_product_variants
set
  image_url = 'https://files.manuscdn.com/user_upload_by_module/session_file/310519663584190080/fyjHyiVtbwfnvOXw.jpg',
  options = coalesce(options, '{}'::jsonb) || jsonb_build_object('colour', 'Red', 'sex', 'Unisex')
where id = '20e60795-88e6-4eca-bfe6-7623a2034484';

commit;
