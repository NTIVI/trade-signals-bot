export const useTelegram = () => {
  const tg = window.Telegram?.WebApp;

  const onToggleButton = () => {
    if (tg?.MainButton.isVisible) {
      tg.MainButton.hide();
    } else {
      tg.MainButton.show();
    }
  };

  const onExpand = () => {
    tg?.expand();
  };

  return {
    onToggleButton,
    onExpand,
    tg,
    user: tg?.initDataUnsafe?.user,
    queryId: tg?.initDataUnsafe?.query_id,
  };
};
