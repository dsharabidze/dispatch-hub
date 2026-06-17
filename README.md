# საბოლოო პროექტის შაბლონი

ვებ ინჟინერია 2026-ის საბოლოო პროექტის საწყისი სტრუქტურა. გახსენი `index.html` ბრაუზერში და დაიწყე მშენებლობა.

**პირველ რიგში შეცვალე:**

- `BASE_URL` — `js/api.js`-ში შენი API-ს მისამართი
- `<title>` — სამივე HTML ფაილში შენი პროექტის სახელი
- ფერების ცვლადები — `css/style.css`-ში
- გვერდის სახელები საჭიროების შემთხვევაში — `login.html` / `saved.html` შეიძლება გადაარქვა სახელი

**ფაილების სტრუქტურა:**

```
შენი-პროექტი/
├── index.html        ← მთავარი გვერდი
├── login.html        ← ავტორიზაციის გვერდი (სახელი შეიძლება შეიცვალოს)
├── saved.html        ← შენახული ელემენტების გვერდი (სახელი შეიძლება შეიცვალოს)
├── css/
│   └── style.css
├── js/
│   ├── main.js       ← entry point index.html-ისთვის
│   ├── login.js      ← entry point login.html-ისთვის
│   ├── saved.js      ← entry point saved.html-ისთვის
│   └── api.js        ← fetch ლოგიკა + localStorage-ის დამხმარეები
└── assets/
```

სრული ტექნიკური მოთხოვნები და შეფასების კრიტერიუმები იხილე [პროექტის პირობებში](https://github.com/cu-cst-web1-2026-geo/materials/blob/main/lecture_13/final_project/README.md).
