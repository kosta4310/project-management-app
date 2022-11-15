import React from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { useAppSelector } from 'store/hooks';
import { boardsSelector } from 'store/boardsSlice';
import { toast } from 'react-toastify';
import Icon from 'components/Icon/Icon';
import pencil from 'assets/images/pencil.png';
import styles from './boards.module.scss';
import { authSelector } from 'store/authSlice';
import ROUTES from 'utils/constants/ROUTES';

const Boards = () => {
  const { isLogged } = useAppSelector(authSelector);
  const boards = useAppSelector(boardsSelector);
  const navigate = useNavigate();

  const createBoard = () => {
    toast.success(`успешный успех`);
  };

  const navigateToBoardPage = (id: string) => {
    navigate(`/boards/${id}`);
  };

  const deleteBoard = (event: React.MouseEvent) => {
    event.stopPropagation();
  };

  if (!isLogged) return <Navigate to={ROUTES.signIn} />;

  return (
    <section className={styles.wrapper}>
      <h2 className={styles.title}>My Boards</h2>
      <ul className={styles.list}>
        <li className={`${styles.card} ${styles.cardCreate}`} onClick={createBoard}>
          <h3 className={`${styles.cardName} ${styles.cardCreateName}`}>Create new board</h3>
          <img src={pencil} alt="yellow pencil" className={styles.image} />
        </li>
        {boards.map((board) => (
          <li
            key={board.title}
            className={styles.card}
            onClick={() => navigateToBoardPage(board._id)}
          >
            <div className={styles.titleWrapper}>
              <h3 className={styles.cardName}>{board.title}</h3>
              <button className={styles.button} onClick={(e) => deleteBoard(e)}>
                <Icon color="#CC0707" size={100} icon="trash" className={styles.icon} />
              </button>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
};

export default Boards;
