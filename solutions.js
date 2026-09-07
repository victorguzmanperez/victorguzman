document.addEventListener("DOMContentLoaded", () => {

  const filterButtons =
    document.querySelectorAll(".solution-filter");

  const solutionCards =
    document.querySelectorAll(".solution-card");


  if (
    filterButtons.length === 0 ||
    solutionCards.length === 0
  ) {
    return;
  }


  filterButtons.forEach((button) => {

    button.addEventListener("click", () => {

      const selectedFilter =
        button.dataset.filter;


      /* =========================
         ACTUALIZAR BOTONES
      ========================= */

      filterButtons.forEach((currentButton) => {

        const isActive =
          currentButton === button;

        currentButton.classList.toggle(
          "active",
          isActive
        );

        currentButton.setAttribute(
          "aria-pressed",
          String(isActive)
        );

      });


      /* =========================
         FILTRAR TARJETAS
      ========================= */

      solutionCards.forEach((card) => {

        const categories =
          card.dataset.category
            ?.split(" ")
            .filter(Boolean) || [];


        const shouldShow =
          selectedFilter === "all" ||
          categories.includes(selectedFilter);


        card.classList.toggle(
          "is-hidden",
          !shouldShow
        );

      });

    });

  });

});
